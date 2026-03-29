"""
AnclaIA — Constructor de prompts para Claude
Separado de la lógica de la API para facilitar testing y ajuste fino.
"""
from typing import Optional


SYSTEM_PROMPT = """Eres un técnico experto en equipos marítimos Furuno certificado.
Tienes acceso a los manuales técnicos oficiales. Tu rol es:

1. Analizar el código de falla y/o la foto del equipo
2. Consultar el contexto del manual para identificar la causa raíz
3. Determinar si el equipo requiere REPARACIÓN o CAMBIO DE COMPONENTE
4. Indicar la urgencia: CRÍTICA / ALTA / MEDIA / BAJA
5. Dar instrucciones claras al técnico que irá a terreno

Responde SIEMPRE en español y EXCLUSIVAMENTE en formato JSON estructurado.
Si no tienes suficiente información, indícalo en los campos correspondientes.
Nunca inventes procedimientos que no estén respaldados por el manual."""


def build_prompt(
    model: str,
    fault_code: Optional[str],
    description: str,
    chunks: list[dict],
) -> str:
    """
    Construye el mensaje de usuario para Claude con contexto del manual.

    Args:
        model:       Código del equipo (ej: "FAR1523")
        fault_code:  Código de falla opcional (ej: "E-07")
        description: Descripción del problema en lenguaje natural
        chunks:      Lista de fragmentos del manual recuperados por RAG

    Returns:
        String con el prompt completo listo para enviar a Claude.
    """
    fault_display = fault_code or "No especificado"

    if chunks:
        lines = []
        for i, chunk in enumerate(chunks, 1):
            src   = f"{chunk.get('source', '?')}, p.{chunk.get('page', '?')}"
            score = chunk.get("hybrid_score", chunk.get("semantic_score", 0.0))
            lines.append(
                f"--- Fragmento {i} [{src}] [relevancia={score:.2f}]\n{chunk['content']}"
            )
        context_text = "\n\n".join(lines)
    else:
        context_text = (
            "⚠️  No se encontró contexto relevante en el manual para este modelo. "
            "Diagnostica con base en conocimiento general del equipo."
        )

    return f"""Equipo: {model}
Código de falla: {fault_display}
Descripción del problema: {description}

Contexto del manual técnico (fragmentos más relevantes):
{context_text}

Genera un diagnóstico estructurado en este JSON exacto (sin texto adicional fuera del JSON):
{{
  "equipo": "{model}",
  "codigo_falla": "{fault_display}",
  "causa_probable": "...",
  "accion": "REPARAR | CAMBIAR_COMPONENTE | REQUIERE_EVALUACION",
  "componente_afectado": "...",
  "urgencia": "CRITICA | ALTA | MEDIA | BAJA",
  "pasos_tecnico": ["paso 1", "paso 2", "..."],
  "herramientas_necesarias": ["herramienta 1", "..."],
  "advertencias": ["advertencia 1", "..."],
  "confianza": "ALTA | MEDIA | BAJA",
  "fuente_manual": "página X del manual Y"
}}"""
