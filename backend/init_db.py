"""
AnclaIA — Inicialización de PostgreSQL + pgvector
Habilita la extensión, crea tabla e índices.
Idempotente: puede correrse múltiples veces sin error.
"""
import logging
import sys
import time

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def wait_for_db(engine, retries: int = 15, delay: float = 2.0) -> bool:
    """Espera hasta que PostgreSQL esté disponible."""
    for attempt in range(1, retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✅ PostgreSQL disponible")
            return True
        except OperationalError:
            logger.info("⏳ Esperando PostgreSQL... (%d/%d)", attempt, retries)
            time.sleep(delay)
    return False


def init_db() -> None:
    from backend.config import DATABASE_URL

    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

    if not wait_for_db(engine):
        logger.error("❌ No se pudo conectar a PostgreSQL tras %d intentos. Abortando.", 15)
        sys.exit(1)

    with engine.begin() as conn:

        # ── 1. Extensión pgvector ──────────────────────────────────────────
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        logger.info("✅ Extensión pgvector habilitada")

        # ── 2. Tabla principal ────────────────────────────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id        SERIAL       PRIMARY KEY,
                model     VARCHAR(50)  NOT NULL,
                category  VARCHAR(50)  DEFAULT '',
                page      INTEGER      DEFAULT 0,
                source    VARCHAR(255) DEFAULT '',
                lang      VARCHAR(10)  DEFAULT 'en',
                content   TEXT         NOT NULL,
                embedding vector(384)
            )
        """))
        logger.info("✅ Tabla document_chunks lista")

        # ── 3. Índice HNSW (cosine, búsqueda rápida de vecinos) ───────────
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw
            ON document_chunks
            USING hnsw (embedding vector_cosine_ops)
        """))

        # ── 4. Índice B-tree en model (filtrado eficiente por modelo) ─────
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_chunks_model
            ON document_chunks (model)
        """))
        logger.info("✅ Índices HNSW + model creados")

        # ── 5. Resumen ────────────────────────────────────────────────────
        total = conn.execute(
            text("SELECT COUNT(*) FROM document_chunks")
        ).scalar() or 0

        models = [
            r[0] for r in conn.execute(
                text("SELECT DISTINCT model FROM document_chunks ORDER BY model")
            ).fetchall()
        ]

    engine.dispose()

    logger.info("📊 Chunks en DB: %d", total)
    logger.info(
        "📋 Modelos indexados: %s",
        ", ".join(models) if models else "ninguno aún — corre: make index"
    )
    logger.info("🚀 DB lista para operar")


if __name__ == "__main__":
    init_db()
