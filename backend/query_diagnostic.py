"""
AnclaIA — API de diagnóstico RAG + Claude Vision
FastAPI: POST /diagnose  GET /health  GET /models  GET /diagnose/example  GET /

Stack:
    - pgvector  → búsqueda híbrida semántica + keyword
    - Claude    → diagnóstico estructurado en JSON
    - Vision    → análisis de foto del equipo (opcional)
"""
import base64
import json
import logging
from typing import Optional

from openai import OpenAI
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import LLM_API_KEY, LLM_BASE_URL, LLM_MODEL
from backend.prompt_builder import SYSTEM_PROMPT, build_prompt
from backend.vector_store import VectorStore

logger = logging.getLogger(__name__)

app = FastAPI(
    title="AnclaIA — Diagnóstico de equipos marítimos",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Clientes globales ─────────────────────────────────────────────────────────
store      = VectorStore()
llm_client = OpenAI(
    api_key=LLM_API_KEY,
    base_url=LLM_BASE_URL,
    default_headers={
        "HTTP-Referer": "https://anclaia.cl",
        "X-Title":      "AnclaIA",
    },
)


# ── Utilidades ────────────────────────────────────────────────────────────────

def _context_quality(chunks: list[dict]) -> str:
    """
    Califica la calidad del contexto recuperado según hybrid_score promedio.
        HIGH   → score ≥ 0.75  (manual muy relevante encontrado)
        MEDIUM → score ≥ 0.50  (algo de contexto, puede ser genérico)
        LOW    → score < 0.50  (contexto débil o ausente)
    """
    if not chunks:
        return "LOW"
    avg = sum(c.get("hybrid_score", c.get("semantic_score", 0)) for c in chunks) / len(chunks)
    if avg >= 0.75:
        return "HIGH"
    if avg >= 0.50:
        return "MEDIUM"
    return "LOW"


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name":           "AnclaIA API",
        "version":        "0.2.0",
        "status":         "ok",
        "indexed_chunks": store.count(),
        "models":         store.list_models(),
    }


@app.post("/diagnose")
async def diagnose(
    model:       str            = Form(..., description="Modelo del equipo, ej: FAR1523"),
    fault_code:  Optional[str]  = Form(None, description="Código de falla, ej: E-07"),
    description: str            = Form(..., description="Descripción del problema"),
    image:       Optional[UploadFile] = File(None, description="Foto del equipo o display"),
):
    """
    Diagnóstico completo con RAG + Claude Vision.
    Retorna JSON estructurado con causa, acción, urgencia y pasos técnicos.
    """
    # ── 1. Verificar modelo indexado ──────────────────────────────────────────
    model_chunks = store.model_count(model)
    if model_chunks == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Modelo {model} no indexado aún. Ejecuta: make index o make docker-index",
        )

    # ── 2. Hybrid RAG retrieval ───────────────────────────────────────────────
    query  = f"{model} {fault_code or ''} {description}".strip()
    chunks = store.search(query=query, model=model, top_k=5, fault_code=fault_code)

    ctx_quality = _context_quality(chunks)
    logger.info(
        "RAG → modelo=%s, fault_code=%s, chunks=%d, quality=%s",
        model, fault_code, len(chunks), ctx_quality,
    )

    # ── 3. Construir prompt ───────────────────────────────────────────────────
    prompt_text = build_prompt(model, fault_code, description, chunks)

    # ── 4. Construir mensaje para Gemini (con imagen opcional) ────────────────
    user_content: list[dict] = []

    if image:
        img_bytes = await image.read()
        img_b64   = base64.standard_b64encode(img_bytes).decode()
        ext       = (image.filename or "img").split(".")[-1].lower()
        mime      = f"image/{'jpeg' if ext in ('jpg', 'jpeg') else ext}"
        user_content.append({
            "type":      "image_url",
            "image_url": {"url": f"data:{mime};base64,{img_b64}"},
        })

    user_content.append({"type": "text", "text": prompt_text})

    # ── 5. Llamada a Gemini Flash ─────────────────────────────────────────────
    response = llm_client.chat.completions.create(
        model=LLM_MODEL,
        max_tokens=1500,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": user_content},
        ],
    )

    msg = response.choices[0].message
    raw = (msg.content or getattr(msg, "reasoning", None) or "").strip()

    # ── 6. Parsear JSON de respuesta ──────────────────────────────────────────
    try:
        start     = raw.find("{")
        end       = raw.rfind("}") + 1
        diagnosis = json.loads(raw[start:end])
    except Exception:
        diagnosis = {"raw_response": raw, "parse_error": True}

    return JSONResponse(content={
        "diagnosis":       diagnosis,
        "context_quality": ctx_quality,
        "context_used":    len(chunks),
        "model_used":      LLM_MODEL,
    })


@app.get("/diagnose/example")
def diagnose_example():
    """
    Diagnóstico de ejemplo para FAR1523 / E-07 sin llamar a Claude API.
    Útil para desarrollar el frontend sin gastar tokens.
    """
    return JSONResponse(content={
        "diagnosis": {
            "equipo":              "FAR1523",
            "codigo_falla":        "E-07",
            "causa_probable":      (
                "Falla en cable de antena RF o conector coaxial deteriorado. "
                "El código E-07 indica pérdida de señal en el circuito de antena."
            ),
            "accion":              "CAMBIAR_COMPONENTE",
            "componente_afectado": "Cable coaxial / conector RF de antena",
            "urgencia":            "ALTA",
            "pasos_tecnico": [
                "Apagar el radar desde el interruptor principal.",
                "Verificar continuidad del cable coaxial con multímetro (debe ser < 2 Ω).",
                "Inspeccionar visualmente los conectores PL-259 en ambos extremos.",
                "Si hay corrosión o daño físico, reemplazar el cable coaxial completo.",
                "Reconectar y encender el radar; verificar que E-07 desaparece.",
                "Realizar test de eco a corta distancia para confirmar operación normal.",
            ],
            "herramientas_necesarias": [
                "Multímetro digital",
                "Llave torque 15 Nm",
                "Cable coaxial RG-214 de repuesto",
                "Conector PL-259 de repuesto",
            ],
            "advertencias": [
                "Apagar el equipo ANTES de desconectar la antena.",
                "No operar el transmisor sin antena conectada — daño al magnetrón.",
                "Usar equipo de protección si hay RF activa en el área.",
            ],
            "confianza":     "ALTA",
            "fuente_manual": "página 8-3 del FAR15XX Installation Manual",
        },
        "context_quality": "HIGH",
        "context_used":    5,
        "model_used":      "example (sin API call)",
    })


@app.get("/health")
def health():
    total  = store.count()
    models = store.list_models()
    return {
        "status":         "ok",
        "indexed_chunks": total,
        "models":         models,
        "db_backend":     "pgvector",
    }


@app.get("/models")
def list_models():
    return {"models": store.list_models()}
