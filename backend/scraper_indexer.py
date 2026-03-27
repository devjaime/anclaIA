"""
Humanloop Maritime — Furuno Manual Scraper + RAG Indexer
Stack: httpx + BeautifulSoup + ChromaDB + sentence-transformers
"""

import httpx
import asyncio
import os
import json
from pathlib import Path
from bs4 import BeautifulSoup
import chromadb
from chromadb.utils import embedding_functions

# ── Equipos a indexar (agrega más según necesites)
PRODUCTS = [
    {"model": "FAR1523", "category": "radar"},
    {"model": "FAR1518", "category": "radar"},
    {"model": "FAR2127", "category": "radar"},
    # GMDSS
    {"model": "FM8900S", "category": "gmdss"},
    # AIS
    {"model": "FA170",   "category": "ais"},
    # Ecosondas
    {"model": "FCV628",  "category": "ecosonda"},
    {"model": "DFF3",    "category": "ecosonda"},
]

SUPPORT_BASE  = "https://www.furunousa.com/en/support/{model}"
MANUALS_DIR   = Path("manuals")
MANUALS_DIR.mkdir(exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; HumanloopMaritime/1.0)"
}

# ── 1. Scraping: extrae URLs de PDFs desde la página de soporte
async def get_manual_urls(client: httpx.AsyncClient, model: str) -> list[dict]:
    url = SUPPORT_BASE.format(model=model)
    try:
        r = await client.get(url, headers=HEADERS, follow_redirects=True)
        r.raise_for_status()
    except Exception as e:
        print(f"  ⚠️  {model}: error al acceder ({e})")
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    manuals = []

    for a in soup.select("a[href$='.pdf']"):
        href = a.get("href", "")
        if not href.startswith("http"):
            href = "https://www.furunousa.com" + href
        title = a.get_text(strip=True)
        # Filtra solo manuales (operators + installation), prioriza español
        if any(kw in title.lower() for kw in ["manual", "operator", "installation", "service"]):
            lang = "es" if "spanish" in title.lower() else \
                   "fr" if "french"  in title.lower() else "en"
            manuals.append({"title": title, "url": href, "lang": lang})

    return manuals

# ── 2. Descarga PDF
async def download_pdf(client: httpx.AsyncClient, url: str, dest: Path):
    if dest.exists():
        print(f"  ✓ ya existe: {dest.name}")
        return
    try:
        async with client.stream("GET", url, headers=HEADERS, follow_redirects=True) as r:
            r.raise_for_status()
            with open(dest, "wb") as f:
                async for chunk in r.aiter_bytes(8192):
                    f.write(chunk)
        print(f"  ↓ descargado: {dest.name}")
    except Exception as e:
        print(f"  ✗ error descargando {url}: {e}")

# ── 3. Extrae texto del PDF con PyMuPDF (fitz)
def extract_text_from_pdf(pdf_path: Path) -> list[dict]:
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("  ⚠️  instala PyMuPDF: pip install pymupdf")
        return []

    chunks = []
    doc = fitz.open(str(pdf_path))

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text").strip()
        if len(text) < 50:  # página vacía o solo imágenes
            continue

        # Chunking simple: ventana de ~800 chars con overlap de 100
        window, overlap = 800, 100
        for i in range(0, len(text), window - overlap):
            chunk = text[i:i + window].strip()
            if len(chunk) > 100:
                chunks.append({
                    "text": chunk,
                    "page": page_num + 1,
                    "source": pdf_path.name,
                })

    doc.close()
    return chunks

# ── 4. Indexa en ChromaDB
def index_chunks(chunks: list[dict], model: str, category: str, collection):
    if not chunks:
        return

    ids       = [f"{model}_p{c['page']}_{i}" for i, c in enumerate(chunks)]
    documents = [c["text"] for c in chunks]
    metadatas = [{
        "model":    model,
        "category": category,
        "page":     c["page"],
        "source":   c["source"],
    } for c in chunks]

    # ChromaDB acepta max 5461 por batch
    batch = 500
    for i in range(0, len(ids), batch):
        collection.add(
            ids=ids[i:i+batch],
            documents=documents[i:i+batch],
            metadatas=metadatas[i:i+batch],
        )
    print(f"  ✅ {len(chunks)} chunks indexados para {model}")

# ── 5. Main
async def main():
    # ChromaDB local persistente
    chroma_client = chromadb.PersistentClient(path="./chroma_db")
    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="paraphrase-multilingual-MiniLM-L12-v2"  # soporta español
    )
    collection = chroma_client.get_or_create_collection(
        name="maritime_manuals",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},
    )

    manifest = []  # registro de lo que se descargó

    async with httpx.AsyncClient(timeout=60) as client:
        for product in PRODUCTS:
            model    = product["model"]
            category = product["category"]
            print(f"\n📡 {model} ({category})")

            manuals = await get_manual_urls(client, model)
            if not manuals:
                print("  sin manuales encontrados")
                continue

            for manual in manuals:
                # Prioriza español, descarta francés si hay español disponible
                if manual["lang"] == "fr":
                    has_es = any(m["lang"] == "es" for m in manuals)
                    if has_es:
                        continue

                filename = f"{model}_{manual['lang']}_{Path(manual['url']).name}"
                dest = MANUALS_DIR / filename

                await download_pdf(client, manual["url"], dest)

                if dest.exists():
                    chunks = extract_text_from_pdf(dest)
                    index_chunks(chunks, model, category, collection)
                    manifest.append({
                        "model": model, "category": category,
                        "file": str(dest), "lang": manual["lang"],
                        "chunks": len(chunks),
                    })

    # Guarda manifest
    with open("manifest.json", "w") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Indexación completa. Total docs: {collection.count()}")
    print("📄 Manifest guardado en manifest.json")


if __name__ == "__main__":
    asyncio.run(main())
