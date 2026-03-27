# AnclaIA — Maritime AI Diagnostics

## Qué es este proyecto
Marketplace vertical para técnicos marítimos certificados en LATAM.
MVP: sistema de diagnóstico de fallas de equipos náuticos (Furuno) usando RAG + Claude Vision.
El técnico ingresa código de falla + foto → recibe diagnóstico estructurado antes de ir a terreno.

## Stack
- **Backend**: FastAPI + Python 3.12
- **Vector DB**: ChromaDB (persistente local, migrar a pgvector en producción)
- **AI**: Claude API `claude-sonnet-4-20250514` con vision habilitada
- **Embeddings**: `paraphrase-multilingual-MiniLM-L12-v2` (soporte español)
- **Scraping**: httpx + BeautifulSoup (PDFs públicos furunousa.com)
- **PDF parsing**: PyMuPDF (fitz)
- **Frontend MVP**: React + Tailwind (form simple, sin auth por ahora)
- **Infra**: Railway o Fly.io (deploy simple)

## Estructura del proyecto
```
anclaIA/
├── CLAUDE.md                  ← este archivo
├── README.md
├── backend/
│   ├── scraper_indexer.py     ← descarga PDFs Furuno + indexa ChromaDB
│   ├── query_diagnostic.py    ← FastAPI: POST /diagnose, GET /health, GET /models
│   ├── requirements.txt
│   └── chroma_db/             ← vector store local (gitignored)
├── frontend/
│   ├── src/
│   │   └── App.jsx            ← form diagnóstico + resultado
│   └── package.json
├── data/
│   └── manuals/               ← PDFs descargados (gitignored)
└── .env.example
```

## Variables de entorno
```
ANTHROPIC_API_KEY=sk-ant-...
CHROMA_PATH=./backend/chroma_db
MANUALS_PATH=./data/manuals
```

## Comandos clave
```bash
# Setup
pip install -r backend/requirements.txt

# Indexar manuales (solo una vez)
python backend/scraper_indexer.py

# Levantar API
uvicorn backend.query_diagnostic:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

## Endpoints API
- `POST /diagnose` — recibe model, fault_code, description, image (opcional)
- `GET /health` — status + chunks indexados
- `GET /models` — modelos disponibles en ChromaDB

## Equipos MVP (modelos Furuno priorizados)
- FAR1523, FAR1518 — Radares
- FCV628 — Ecosonda
- FA170 — AIS
- FM8900S — GMDSS

## Respuesta diagnóstico (JSON)
```json
{
  "equipo": "FAR1523",
  "codigo_falla": "E-07",
  "causa_probable": "...",
  "accion": "REPARAR | CAMBIAR_COMPONENTE | REQUIERE_EVALUACION",
  "componente_afectado": "...",
  "urgencia": "CRITICA | ALTA | MEDIA | BAJA",
  "pasos_tecnico": ["..."],
  "herramientas_necesarias": ["..."],
  "advertencias": ["..."],
  "confianza": "ALTA | MEDIA | BAJA",
  "fuente_manual": "página X del manual Y"
}
```

## Decisiones de diseño importantes
- Los PDFs de Furuno son públicos en furunousa.com/en/support/{MODEL}
- Priorizar manuales en español, fallback inglés
- Chunking: ventana 800 chars, overlap 100
- RAG retrieval: top-5 chunks filtrados por metadata.model
- El frontend MVP NO requiere auth — es interno para técnicos del socio
- No guardar PDFs ni chroma_db en git (.gitignore)

## Contexto de negocio
- Socio: acceso a 8 técnicos marítimos certificados en Chile
- Cliente objetivo inicial: flotas pesqueras y navieras medianas (no yates)
- Revenue: 15% comisión por servicio + suscripción técnico $29/mes Pro
- Siguiente fase: matching automático técnico + scheduling
- Dominio: anclaIA.cl (por registrar en nic.cl)
