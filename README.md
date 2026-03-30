# AnclaIA — Maritime Equipment AI Diagnostics

> **English** | [Español](#español)

AI-powered fault diagnostics for Furuno marine equipment.
A certified technician inputs an error code + photo → receives structured diagnosis before heading to the vessel.

---

## Demo

![AnclaIA UI](https://raw.githubusercontent.com/devjaime/anclaIA/main/docs/demo.png)

**Live stack:** 31,000+ indexed chunks · 7 Furuno models · RAG hybrid search · Vision-enabled LLM

---

## What it does

A maritime technician receives a fault report on a vessel. Before traveling to diagnose it in person, they open AnclaIA and enter:
- The equipment model (e.g. `FAR1523` radar)
- The fault code (e.g. `E-07`)
- A description and optional photo of the display

The system returns a structured JSON diagnosis with:

| Field | Description |
|---|---|
| `causa_probable` | Root cause from the technical manual |
| `accion` | `REPAIR` / `REPLACE_COMPONENT` / `REQUIRES_EVALUATION` |
| `componente_afectado` | Specific component to inspect |
| `urgencia` | `CRITICAL` / `HIGH` / `MEDIUM` / `LOW` |
| `pasos_tecnico` | Step-by-step repair instructions |
| `herramientas_necesarias` | Required tools list |
| `advertencias` | Safety warnings |
| `confianza` | Confidence level: `HIGH` / `MEDIUM` / `LOW` |
| `fuente_manual` | Manual page source |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + Python 3.12 |
| Vector DB | **pgvector** (PostgreSQL 16) — hybrid semantic + keyword search |
| AI / LLM | OpenRouter (vision-enabled, model swappable via `.env`) |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` (384-dim, Spanish support) |
| PDF parsing | PyMuPDF + custom chunker (800 chars, 100 overlap) |
| Frontend | React 18 + Tailwind CSS + Vite (mobile-first) |
| Video | Remotion (programmatic video embedded in the app) |
| Infra | Docker Compose (PostgreSQL + FastAPI + Vite) |

---

## Architecture

```
User → fault_code + description + photo (optional)
         ↓
   Hybrid RAG Search (pgvector)
     70% semantic (cosine similarity) + 30% keyword (ILIKE)
     Mandatory filter by equipment model
         ↓
   Top-5 chunks from the technical manual
         ↓
   LLM with Vision (photo analysis if provided)
         ↓
   Structured JSON: cause · action · urgency · steps · tools
```

---

## Quick Start (Docker — recommended)

```bash
git clone https://github.com/devjaime/anclaIA
cd anclaIA

# 1. Configure environment variables
cp .env.example .env
# Edit .env: set LLM_API_KEY (OpenRouter key from openrouter.ai/keys)

# 2. Start all 3 services (db + backend + frontend)
make docker-up

# 3. Download and index Furuno manuals
make docker-index

# 4. Verify everything is running
curl http://localhost:8000/health
```

Open: **http://localhost:6001**

> **Note for USB/FAT32 drives:** Use `DOCKER_BUILDKIT=0 docker compose up --build` instead of `make docker-up`

---

## Local Setup (uv)

```bash
# Install dependencies
uv sync

# Start PostgreSQL
docker run -d --name ancla-db \
  -e POSTGRES_DB=ancladb \
  -e POSTGRES_USER=ancla \
  -e POSTGRES_PASSWORD=ancla \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Initialize database schema
make init-db

# Index manuals
make index

# Start backend (port 8000)
make run

# Start frontend dev server (another terminal)
cd frontend && npm install && npm run dev
```

---

## Makefile Commands

| Command | Description |
|---|---|
| `make install` | Install Python dependencies with uv |
| `make init-db` | Create tables and indexes in PostgreSQL |
| `make index` | Download and index Furuno manuals |
| `make run` | Start FastAPI on :8000 |
| `make dev` | Start Vite dev server on :5173 |
| `make docker-up` | Build + start all 3 services |
| `make docker-down` | Stop all services |
| `make docker-logs` | Tail live logs |
| `make docker-index` | Index manuals inside the backend container |

---

## API Endpoints

| Method | Route | Description |
|---|---|---|
| `POST` | `/diagnose` | Full RAG + Vision diagnosis |
| `GET` | `/diagnose/example` | Example diagnosis (no API call) |
| `POST` | `/chat` | Conversational RAG chatbot |
| `GET` | `/health` | Service status + indexed chunks |
| `GET` | `/models` | Available models in pgvector |

### Sample `/diagnose` response

```json
{
  "diagnosis": {
    "equipo": "FAR1523",
    "codigo_falla": "E-07",
    "causa_probable": "Fault in RF antenna coaxial cable or deteriorated connector.",
    "accion": "CAMBIAR_COMPONENTE",
    "componente_afectado": "Coaxial cable / RF antenna connector",
    "urgencia": "ALTA",
    "pasos_tecnico": [
      "Turn off the radar from the main switch.",
      "Check coaxial cable continuity with a multimeter (must be < 2Ω).",
      "Inspect PL-259 connectors at both ends for corrosion.",
      "Replace full coaxial cable if damaged.",
      "Reconnect and power on — verify E-07 disappears."
    ],
    "herramientas_necesarias": ["Digital multimeter", "15Nm torque wrench", "RG-214 coaxial cable"],
    "advertencias": ["Turn off BEFORE disconnecting the antenna.", "Never transmit without antenna connected — magnetron damage."],
    "confianza": "ALTA",
    "fuente_manual": "page 8-3 of FAR15XX Installation Manual"
  },
  "context_quality": "HIGH",
  "context_used": 5,
  "model_used": "mistralai/mistral-small-2603"
}
```

---

## Supported Equipment (MVP)

| Model | Type | Indexed Chunks |
|---|---|---|
| FAR1523, FAR1518 | Marine Radar | ✓ |
| FAR2127 | Marine Radar | ✓ |
| FCV628 | Fish Finder / Echosounder | ✓ |
| FA170 | AIS Transponder | ✓ |
| FM8900S | GMDSS Radio | ✓ |
| DFF3 | Network Sounder | ✓ |

---

## Environment Variables

```bash
# OpenRouter — get your key at openrouter.ai/keys
LLM_API_KEY=sk-or-v1-...
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=mistralai/mistral-small-2603   # swap without rebuild

# PostgreSQL
DATABASE_URL=postgresql://ancla:ancla@db:5432/ancladb

# Paths
MANUALS_PATH=./data/manuals

ENVIRONMENT=development
```

**Recommended models (via OpenRouter):**

| Model | Cost/call | Quality |
|---|---|---|
| `minimax/minimax-m2.5:free` | Free | Good for testing |
| `mistralai/mistral-small-2603` | ~$0.0008 | Production recommended |
| `moonshotai/kimi-k2.5` | ~$0.004 | Highest quality |

---

## Business Model

- **Target market:** Fishing fleets and mid-sized shipping companies in Chile and LATAM
- **Revenue:** 15% commission per service + $29/month Pro subscription per technician
- **Partner:** Network of 8 certified maritime technicians in Chile
- **Next phase:** Automatic technician matching + scheduling

---

## Team

- **Jaime Hernández** ([@devjaime](https://github.com/devjaime)) — AI Engineer

---

---

# Español

> [English](#anclaaia--maritime-equipment-ai-diagnostics) | **Español**

Sistema de diagnóstico de fallas para equipos marítimos Furuno potenciado por IA.
El técnico ingresa código de falla + foto → recibe diagnóstico estructurado antes de ir a terreno.

---

## Qué hace

Un técnico marítimo recibe un reporte de falla en un buque. Antes de viajar a diagnosticarlo en persona, abre AnclaIA e ingresa:
- El modelo del equipo (ej: radar `FAR1523`)
- El código de falla (ej: `E-07`)
- Una descripción y foto opcional del display

El sistema retorna un JSON estructurado con causa probable, componente afectado, pasos técnicos, herramientas necesarias y advertencias de seguridad — todo basado en el manual técnico oficial del equipo.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | FastAPI + Python 3.12 |
| Vector DB | **pgvector** (PostgreSQL 16) — búsqueda híbrida semántica + keyword |
| IA / LLM | OpenRouter (visión habilitada, modelo intercambiable vía `.env`) |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` (384 dim, soporte español) |
| PDF parsing | PyMuPDF + chunker custom (800 chars, overlap 100) |
| Frontend | React 18 + Tailwind CSS + Vite (mobile-first) |
| Video | Remotion (video programático embebido en la app) |
| Infra | Docker Compose (PostgreSQL + FastAPI + Vite) |

---

## Inicio rápido (Docker — recomendado)

```bash
git clone https://github.com/devjaime/anclaIA
cd anclaIA

# 1. Configura variables de entorno
cp .env.example .env
# Edita .env: agrega LLM_API_KEY (key de OpenRouter en openrouter.ai/keys)

# 2. Levanta los 3 servicios
make docker-up

# 3. Descarga e indexa manuales Furuno
make docker-index

# 4. Verifica
curl http://localhost:8000/health
```

Accede en: **http://localhost:6001**

---

## Arquitectura RAG

```
Usuario → código_falla + descripción + foto (opcional)
          ↓
    Búsqueda híbrida (pgvector)
      70% semántico (cosine) + 30% keyword (ILIKE)
      Filtro obligatorio por modelo de equipo
          ↓
    Top-5 chunks del manual técnico
          ↓
    LLM con Visión (análisis de foto si se provee)
          ↓
    JSON estructurado: causa · acción · urgencia · pasos · herramientas
```

---

## Equipos MVP (Furuno)

| Modelo | Tipo |
|---|---|
| FAR1523, FAR1518, FAR2127 | Radar marino |
| FCV628 | Ecosonda / Fish finder |
| FA170 | Transpondedor AIS |
| FM8900S | Radio GMDSS |
| DFF3 | Sonda en red |

---

## Modelo de negocio

- **Mercado objetivo:** Flotas pesqueras y navieras medianas en Chile y LATAM
- **Revenue:** 15% comisión por servicio + suscripción técnico $29/mes Plan Pro
- **Socio:** Red de 8 técnicos marítimos certificados en Chile
- **Siguiente fase:** Matching automático técnico + scheduling

---

## Variables de entorno

```bash
LLM_API_KEY=sk-or-v1-...             # OpenRouter (openrouter.ai/keys)
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=mistralai/mistral-small-2603
DATABASE_URL=postgresql://ancla:ancla@db:5432/ancladb
MANUALS_PATH=./data/manuals
ENVIRONMENT=development
```

---

## Equipo

- **Jaime Hernández** ([@devjaime](https://github.com/devjaime)) — AI Engineer

---

*AnclaIA.cl — Diagnóstico técnico antes de ir a terreno*
