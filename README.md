# AnclaIA

> Diagnóstico de fallas de equipos marítimos con IA + técnicos certificados cuando los necesitas.

## MVP
Sistema RAG que indexa manuales técnicos Furuno y permite diagnosticar fallas mediante código de error + foto, entregando al técnico causa, acción recomendada y urgencia antes de ir a terreno.

## Setup rápido
```bash
git clone https://github.com/devjaime/anclaIA
cd anclaIA
cp .env.example .env   # agregar ANTHROPIC_API_KEY
pip install -r backend/requirements.txt
python backend/scraper_indexer.py
uvicorn backend.query_diagnostic:app --reload
```

## Stack
FastAPI · ChromaDB · Claude API · React

## Equipo
- Jaime Hernández (devjaime) — AI Engineer
- Socio marítimo — red de técnicos certificados
