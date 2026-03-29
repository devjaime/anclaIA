"""
AnclaIA — Furuno Manual Scraper + pgvector Indexer
Stack: httpx + BeautifulSoup + VectorStore (pgvector)

Uso:
    python backend/scraper_indexer.py          # indexa todos los modelos
    make index                                 # vía Makefile
    make docker-index                          # dentro de Docker
"""

import asyncio
import json
import logging
from pathlib import Path

import httpx
from bs4 import BeautifulSoup

from backend.vector_store import VectorStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Equipos a indexar ─────────────────────────────────────────────────────────
PRODUCTS = [
    {"model": "FAR1523", "category": "radar"},
    {"model": "FAR1518", "category": "radar"},
    {"model": "FAR2127", "category": "radar"},
    {"model": "FM8900S", "category": "gmdss"},
    {"model": "FA170",   "category": "ais"},
    {"model": "FCV628",  "category": "ecosonda"},
    {"model": "DFF3",    "category": "ecosonda"},
]

SUPPORT_BASE = "https://www.furunousa.com/en/support/{model}"
MANUALS_DIR  = Path("data/manuals")
HEADERS      = {"User-Agent": "Mozilla/5.0 (compatible; AnclaIA/1.0)"}


# ── 1. Scraping: extrae URLs de PDFs ──────────────────────────────────────────

async def get_manual_urls(client: httpx.AsyncClient, model: str) -> list[dict]:
    url = SUPPORT_BASE.format(model=model)
    try:
        r = await client.get(url, headers=HEADERS, follow_redirects=True)
        r.raise_for_status()
    except Exception as e:
        logger.warning("%s: error al acceder a página de soporte (%s)", model, e)
        return []

    soup     = BeautifulSoup(r.text, "html.parser")
    manuals  = []

    for a in soup.select("a[href$='.pdf']"):
        href = a.get("href", "")
        if not href.startswith("http"):
            href = "https://www.furunousa.com" + href
        title = a.get_text(strip=True)
        if any(kw in title.lower() for kw in ["manual", "operator", "installation", "service"]):
            lang = "es" if "spanish" in title.lower() else \
                   "fr" if "french"  in title.lower() else "en"
            manuals.append({"title": title, "url": href, "lang": lang})

    logger.info("%s: %d PDFs encontrados", model, len(manuals))
    return manuals


# ── 2. Descarga PDF ───────────────────────────────────────────────────────────

async def download_pdf(client: httpx.AsyncClient, url: str, dest: Path) -> bool:
    if dest.exists():
        size_mb = dest.stat().st_size / 1_048_576
        logger.info("  ya existe (%.1f MB): %s", size_mb, dest.name)
        return True
    try:
        async with client.stream("GET", url, headers=HEADERS,
                                  follow_redirects=True, timeout=90) as r:
            r.raise_for_status()
            downloaded = 0
            with open(dest, "wb") as f:
                async for chunk in r.aiter_bytes(16_384):
                    f.write(chunk)
                    downloaded += len(chunk)
        size_mb = downloaded / 1_048_576
        logger.info("  descargado: %s (%.1f MB)", dest.name, size_mb)
        return True
    except Exception as e:
        logger.error("  error descargando %s: %s", dest.name, e)
        if dest.exists():
            dest.unlink()
        return False


# ── 3. Extrae texto del PDF (PyMuPDF) ─────────────────────────────────────────

def extract_text_from_pdf(pdf_path: Path) -> list[dict]:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        logger.error("Instala PyMuPDF: pip install pymupdf")
        return []

    chunks = []
    doc    = fitz.open(str(pdf_path))

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").replace("\x00", "").strip()
        if len(text) < 50:  # página vacía / solo imágenes
            continue

        window, overlap = 800, 100
        for i in range(0, len(text), window - overlap):
            chunk = text[i:i + window].strip()
            if len(chunk) > 100:
                chunks.append({
                    "text":   chunk,
                    "page":   page_num + 1,
                    "source": pdf_path.name,
                })

    doc.close()
    logger.info("  %d chunks extraídos de %s", len(chunks), pdf_path.name)
    return chunks


# ── 4. Indexa usando VectorStore ──────────────────────────────────────────────

def index_chunks(
    chunks: list[dict],
    model: str,
    category: str,
    store: VectorStore,
) -> int:
    """Inserta chunks en pgvector. Retorna cantidad insertada."""
    if not chunks:
        logger.warning("  sin chunks para indexar en %s", model)
        return 0
    n = store.add_chunks(chunks, model, category)
    logger.info("  ✅ %d chunks indexados → modelo=%s", n, model)
    return n


# ── 5. Main ───────────────────────────────────────────────────────────────────

async def main():
    MANUALS_DIR.mkdir(parents=True, exist_ok=True)

    store    = VectorStore()
    manifest = []

    async with httpx.AsyncClient(timeout=60) as client:
        for product in PRODUCTS:
            model    = product["model"]
            category = product["category"]
            logger.info("=== %s (%s) ===", model, category)

            manuals = await get_manual_urls(client, model)
            if not manuals:
                continue

            for manual in manuals:
                # Descarta francés si hay español disponible
                if manual["lang"] == "fr" and any(m["lang"] == "es" for m in manuals):
                    continue

                filename = f"{model}_{manual['lang']}_{Path(manual['url']).name}"
                dest     = MANUALS_DIR / filename

                ok = await download_pdf(client, manual["url"], dest)
                if not ok:
                    continue

                chunks = extract_text_from_pdf(dest)
                n      = index_chunks(chunks, model, category, store)

                manifest.append({
                    "model":    model,
                    "category": category,
                    "file":     str(dest),
                    "lang":     manual["lang"],
                    "chunks":   n,
                })

    # Guarda manifest
    manifest_path = Path("data/manifest.json")
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    total = store.count()
    logger.info("✅ Indexación completa. Total chunks en DB: %d", total)
    logger.info("📄 Manifest: %s", manifest_path)
    logger.info("📋 Modelos disponibles: %s", store.list_models())


if __name__ == "__main__":
    asyncio.run(main())
