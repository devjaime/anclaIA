"""
Humanloop Maritime — API de diagnóstico RAG + Claude Vision
FastAPI endpoint: POST /diagnose
"""

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import anthropic
import chromadb
from chromadb.utils import embedding_functions
import base64
import json
from typing import Optional

app = FastAPI(title="Humanloop Maritime — Diagnóstico IA")

# ── Setup ChromaDB
chroma_client = chromadb.PersistentClient(path="./chroma_db")
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)
collection = chroma_client.get_collection(
    name="maritime_manuals",
    embedding_function=ef,
)

anthropic_client = anthropic.Anthropic()  # usa ANTHROPIC_API_KEY del env

SYSTEM_PROMPT = """Eres un técnico experto en equipos marítimos Furuno certificado.
Tienes acceso a los manuales técnicos oficiales. Tu rol es:

1. Analizar el código de falla y/o la foto del equipo
2. Consultar el contexto del manual para identificar la causa
3. Determinar si el equipo requiere REPARACIÓN o CAMBIO DE COMPONENTE
4. Indicar la urgencia: CRÍTICA / ALTA / MEDIA / BAJA
5. Dar instrucciones claras al técnico que irá a terreno

Responde SIEMPRE en español y en formato JSON estructurado.
Si no tienes suficiente información, indícalo claramente.
Nunca inventes procedimientos que no estén en el manual."""

@app.post("/diagnose")
async def diagnose(
    model: str = Form(..., description="Modelo del equipo, ej: FAR1523"),
    fault_code: Optional[str] = Form(None, description="Código de error, ej: E-07"),
    description: str = Form(..., description="Descripción del problema"),
    image: Optional[UploadFile] = File(None, description="Foto del equipo o display"),
):
    # ── 1. RAG: buscar en manual
    query = f"{model} {fault_code or ''} {description}"
    results = collection.query(
        query_texts=[query],
        n_results=5,
        where={"model": model} if collection.count() > 0 else None,
    )

    context_chunks = "\n\n---\n\n".join(
        results["documents"][0]
    ) if results["documents"] else "No se encontró contexto en el manual."

    # ── 2. Construir mensaje para Claude
    user_content = []

    # Foto si existe
    if image:
        img_bytes = await image.read()
        img_b64   = base64.standard_b64encode(img_bytes).decode()
        ext       = image.filename.split(".")[-1].lower()
        mime      = f"image/{'jpeg' if ext in ['jpg','jpeg'] else ext}"
        user_content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": mime, "data": img_b64},
        })

    user_content.append({
        "type": "text",
        "text": f"""Equipo: {model}
Código de falla: {fault_code or 'No especificado'}
Descripción del problema: {description}

Contexto del manual (top-5 chunks relevantes):
{context_chunks}

Genera un diagnóstico estructurado en este JSON exacto:
{{
  "equipo": "{model}",
  "codigo_falla": "{fault_code or 'N/A'}",
  "causa_probable": "...",
  "accion": "REPARAR | CAMBIAR_COMPONENTE | REQUIERE_EVALUACION",
  "componente_afectado": "...",
  "urgencia": "CRITICA | ALTA | MEDIA | BAJA",
  "pasos_tecnico": ["paso 1", "paso 2", "..."],
  "herramientas_necesarias": ["..."],
  "advertencias": ["..."],
  "confianza": "ALTA | MEDIA | BAJA",
  "fuente_manual": "página X del manual Y"
}}"""
    })

    # ── 3. Llamar a Claude
    response = anthropic_client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_content}],
    )

    raw = response.content[0].text.strip()

    # Parsear JSON de la respuesta
    try:
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        diagnosis = json.loads(raw[start:end])
    except Exception:
        diagnosis = {"raw_response": raw, "parse_error": True}

    return JSONResponse(content={
        "diagnosis": diagnosis,
        "context_used": len(results["documents"][0]) if results["documents"] else 0,
        "model_used": "claude-sonnet-4-20250514",
    })


@app.get("/health")
def health():
    return {
        "status": "ok",
        "indexed_chunks": collection.count(),
    }


@app.get("/models")
def list_models():
    """Lista los modelos indexados en ChromaDB"""
    results = collection.get(include=["metadatas"])
    models = list({m["model"] for m in results["metadatas"]})
    return {"models": sorted(models)}

