"""
AnclaIA — MVP Downloader
Descarga manuales de operación Furuno para modelos prioritarios.
Guarda data/manifest.json con registro de descargas.
"""

import httpx
import asyncio
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from bs4 import BeautifulSoup

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

MVP_MODELS = [
    {"model": "FAR1523", "category": "radar",    "priority": 1},
    {"model": "FAR1518", "category": "radar",    "priority": 2},
    {"model": "FCV628",  "category": "ecosonda", "priority": 1},
    {"model": "FA170",   "category": "ais",      "priority": 1},
    {"model": "FM8900S", "category": "gmdss",    "priority": 1},
]

MANUALS_DIR   = Path("data/manuals")
MANIFEST_PATH = Path("data/manifest.json")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AnclaIA/1.0)"}
PREFER_LANGS = ["spanish", "en"]


async def get_best_manual(client: httpx.AsyncClient, model: str) -> dict | None:
    url = f"https://www.furunousa.com/en/support/{model}"
    try:
        r = await client.get(url, headers=HEADERS, follow_redirects=True, timeout=15)
        r.raise_for_status()
    except Exception as e:
        log.warning("%s: no se pudo acceder a la página de soporte (%s)", model, e)
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    candidates = []

    for a in soup.select("a[href$='.pdf']"):
        title = a.get_text(strip=True).lower()
        href  = a.get("href", "")
        if not href.startswith("http"):
            href = "https://www.furunousa.com" + href
        if "operator" not in title and "operation" not in title:
            continue
        lang = "spanish" if "spanish" in title else \
               "french"  if "french"  in title else "en"
        candidates.append({"title": a.get_text(strip=True), "url": href, "lang": lang})

    if not candidates:
        log.warning("%s: no se encontraron manuales de operación", model)
        return None

    for preferred in PREFER_LANGS:
        match = next((c for c in candidates if c["lang"] == preferred), None)
        if match:
            return match

    return candidates[0]


async def download(client: httpx.AsyncClient, url: str, dest: Path) -> bool:
    if dest.exists():
        size_mb = dest.stat().st_size / 1_048_576
        log.info("  ya existe (%.1f MB): %s", size_mb, dest.name)
        return True
    try:
        async with client.stream("GET", url, headers=HEADERS,
                                  follow_redirects=True, timeout=60) as r:
            r.raise_for_status()
            downloaded = 0
            with open(dest, "wb") as f:
                async for chunk in r.aiter_bytes(16384):
                    f.write(chunk)
                    downloaded += len(chunk)
        size_mb = downloaded / 1_048_576
        log.info("  descargado: %s (%.1f MB)", dest.name, size_mb)
        return True
    except Exception as e:
        log.error("  error descargando %s: %s", dest.name, e)
        if dest.exists():
            dest.unlink()
        return False


async def main():
    MANUALS_DIR.mkdir(parents=True, exist_ok=True)

    # Carga manifest existente para no re-descargar
    existing: list[dict] = []
    if MANIFEST_PATH.exists():
        with open(MANIFEST_PATH) as f:
            existing = json.load(f)
    already_downloaded = {e["file"] for e in existing}

    results = list(existing)

    async with httpx.AsyncClient() as client:
        for p in sorted(MVP_MODELS, key=lambda x: x["priority"]):
            model = p["model"]
            log.info("=== %s (%s) ===", model, p["category"])

            manual = await get_best_manual(client, model)
            if not manual:
                continue

            log.info("  manual: %s [%s]", manual["title"], manual["lang"])
            lang_label = "es" if manual["lang"] == "spanish" else manual["lang"]
            fname = f"{model}_{lang_label}_operators.pdf"
            dest  = MANUALS_DIR / fname

            if str(dest) in already_downloaded:
                log.info("  ya en manifest, saltando: %s", fname)
                continue

            ok = await download(client, manual["url"], dest)
            if ok:
                size_mb = dest.stat().st_size / 1_048_576
                results.append({
                    "model":     model,
                    "category":  p["category"],
                    "file":      str(dest),
                    "lang":      manual["lang"],
                    "size_mb":   round(size_mb, 1),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    log.info("=== Descarga completa: %d/%d manuales ===", len(results), len(MVP_MODELS))
    log.info("Manifest guardado en %s", MANIFEST_PATH)
    total_mb = sum(r["size_mb"] for r in results)
    log.info("Tamaño total: %.1f MB", total_mb)


if __name__ == "__main__":
    asyncio.run(main())
