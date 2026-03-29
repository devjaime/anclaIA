FROM python:3.12-slim

# uv: instalador de paquetes Python ultra-rápido
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/

WORKDIR /app

# ── Dependencias (capa separada para cache de Docker) ─────────────────────────
# Usamos requirements.txt como fuente de verdad (no necesita uv.lock actualizado)
COPY backend/requirements.txt ./backend/requirements.txt
RUN uv pip install --system --no-cache -r backend/requirements.txt

# ── Código fuente ─────────────────────────────────────────────────────────────
COPY backend/ ./backend/

EXPOSE 8000

# ── Entrypoint: inicializa DB y luego arranca la API ─────────────────────────
# init_db.py es idempotente (puede correrse múltiples veces sin error)
# Espera hasta que PostgreSQL esté disponible antes de arrancar uvicorn
CMD ["sh", "-c", \
     "python -m backend.init_db && \
      uvicorn backend.query_diagnostic:app \
        --host 0.0.0.0 --port 8000 --workers 1"]
