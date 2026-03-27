"""
Humanloop Maritime — MVP Downloader
Descarga solo manuales de operación en español de modelos prioritarios.
Estrategia: 1 manual por categoría, el más representativo.
"""

import httpx
import asyncio
from pathlib import Path
from bs4 import BeautifulSoup

# ── Solo los modelos más comunes en flotas chilenas/LATAM
# Tu socio debe confirmar esta lista — pero es un buen punto de partida
MVP_MODELS = [
    # Radares (el más consultado en fallas)
    {"model": "FAR1523", "category": "radar",    "priority": 1},
    {"model": "FAR1518", "category": "radar",    "priority": 2},
    # Ecosondas
    {"model": "FCV628",  "category": "ecosonda", "priority": 1},
    # AIS
    {"model": "FA170",   "category": "ais",      "priority": 1},
    # GMDSS
    {"model": "FM8900S", "category": "gmdss",    "priority": 1},
]

MANUALS_DIR = Path("manuals_mvp")
MANUALS_DIR.mkdir(exist_ok=True)

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; HumanloopMaritime/1.0)"}

PREFER_LANGS = ["spanish", "en"]  # prioriza español, fallback inglés

async def get_best_manual(client, model: str) -> dict | None:
    url = f"https://www.furunousa.com/en/support/{model}"
    try:
        r = await client.get(url, headers=HEADERS, follow_redirects=True, timeout=15)
        r.raise_for_status()
    except Exception as e:
        print(f"  ⚠ {model}: {e}")
        return None

    soup = BeautifulSoup(r.text, "html.parser")
    candidates = []

    for a in soup.select("a[href$='.pdf']"):
        title = a.get_text(strip=True).lower()
        href  = a.get("href", "")
        if not href.startswith("http"):
            href = "https://www.furunousa.com" + href

        # Solo manuales de operación (no installation, packing, brochure)
        if "operator" not in title and "operation" not in title:
            continue

        lang = "spanish" if "spanish" in title else \
               "french"  if "french"  in title else "en"
        candidates.append({"title": a.get_text(strip=True), "url": href, "lang": lang})

    if not candidates:
        return None

    # Prioriza español
    for preferred in PREFER_LANGS:
        match = next((c for c in candidates if c["lang"] == preferred), None)
        if match:
            return match

    return candidates[0]

async def download(client, url: str, dest: Path):
    if dest.exists():
        size_mb = dest.stat().st_size / 1_048_576
        print(f"  ✓ ya existe ({size_mb:.1f} MB): {dest.name}")
        return True
    try:
        async with client.stream("GET", url, headers=HEADERS,
                                  follow_redirects=True, timeout=60) as r:
            r.raise_for_status()
            total = int(r.headers.get("content-length", 0))
            downloaded = 0
            with open(dest, "wb") as f:
                async for chunk in r.aiter_bytes(16384):
                    f.write(chunk)
                    downloaded += len(chunk)
            size_mb = downloaded / 1_048_576
            print(f"  ↓ {dest.name} ({size_mb:.1f} MB)")
            return True
    except Exception as e:
        print(f"  ✗ error: {e}")
        if dest.exists():
            dest.unlink()
        return False

async def main():
    results = []
    async with httpx.AsyncClient() as client:
        for p in sorted(MVP_MODELS, key=lambda x: x["priority"]):
            model = p["model"]
            print(f"\n📡 {model} ({p['category']})")

            manual = await get_best_manual(client, model)
            if not manual:
                print("  sin manual de operación encontrado")
                continue

            print(f"  → {manual['title']} [{manual['lang']}]")
            fname = f"{model}_{manual['lang']}_operators.pdf"
            dest  = MANUALS_DIR / fname

            ok = await download(client, manual["url"], dest)
            if ok:
                size_mb = dest.stat().st_size / 1_048_576
                results.append({**p, "file": str(dest),
                                 "lang": manual["lang"],
                                 "size_mb": round(size_mb, 1)})

    print("\n" + "="*50)
    print(f"✅ MVP descargado: {len(results)}/{len(MVP_MODELS)} manuales")
    total_mb = sum(r["size_mb"] for r in results)
    print(f"📦 Tamaño total: {total_mb:.1f} MB")
    print("\nResumen:")
    for r in results:
        lang_label = "ES" if r["lang"] == "spanish" else "EN"
        print(f"  [{lang_label}] {r['model']:12} {r['category']:10} {r['size_mb']:.1f} MB")

    print("\nSiguiente paso:")
    print("  python scraper_indexer.py --dir manuals_mvp")

if __name__ == "__main__":
    asyncio.run(main())
