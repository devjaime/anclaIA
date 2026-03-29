"""
AnclaIA — VectorStore con pgvector
Reemplaza ChromaDB. Búsqueda híbrida: semántica + keyword.
"""
import logging
from typing import Optional

from sentence_transformers import SentenceTransformer
from sqlalchemy import create_engine, text

from backend.config import DATABASE_URL

logger = logging.getLogger(__name__)

EMBED_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
VECTOR_DIM  = 384


def _vec(embedding: list[float]) -> str:
    """Lista de floats → string format de pgvector: '[0.1,0.2,...]'"""
    return "[" + ",".join(f"{x:.8f}" for x in embedding) + "]"


class VectorStore:
    """
    Interfaz única para operaciones de vector DB sobre PostgreSQL + pgvector.

    Métodos públicos:
        add_chunks(chunks, model, category) → int
        search(query, model, top_k, fault_code) → list[dict]
        count() → int
        model_count(model) → int
        list_models() → list[str]
    """

    def __init__(self):
        self.engine = create_engine(DATABASE_URL, pool_pre_ping=True)
        self._embedder = SentenceTransformer(EMBED_MODEL)
        logger.info("VectorStore listo (modelo: %s)", EMBED_MODEL)

    # ── Embeddings ────────────────────────────────────────────────────────────

    def embed(self, texts: list[str]) -> list[list[float]]:
        """Retorna embeddings normalizados (cosine-friendly)."""
        return self._embedder.encode(texts, normalize_embeddings=True).tolist()

    # ── Escritura ─────────────────────────────────────────────────────────────

    def add_chunks(self, chunks: list[dict], model: str, category: str) -> int:
        """
        Inserta chunks en document_chunks.
        Cada chunk debe tener: text, page, source.
        Retorna cantidad insertada.
        """
        if not chunks:
            return 0

        texts      = [c["text"] for c in chunks]
        embeddings = self.embed(texts)

        rows = [
            {
                "model":     model,
                "category":  category,
                "page":      c.get("page", 0),
                "source":    c.get("source", ""),
                "lang":      c.get("lang", "en"),
                "content":   c["text"],
                "embedding": _vec(emb),
            }
            for c, emb in zip(chunks, embeddings)
        ]

        sql = text("""
            INSERT INTO document_chunks
                   (model, category, page, source, lang, content, embedding)
            VALUES (:model, :category, :page, :source, :lang, :content,
                    CAST(:embedding AS vector))
        """)

        with self.engine.begin() as conn:
            conn.execute(sql, rows)

        logger.info("Insertados %d chunks para modelo=%s", len(rows), model)
        return len(rows)

    # ── Búsqueda híbrida ──────────────────────────────────────────────────────

    def search(
        self,
        query: str,
        model: str,
        top_k: int = 5,
        fault_code: Optional[str] = None,
    ) -> list[dict]:
        """
        Hybrid search: 0.7 × semantic_score + 0.3 × keyword_score.

        - Siempre filtra por modelo (nunca mezcla FAR1523 con FCV628).
        - Si hay fault_code, lo usa como keyword prioritario.
        - Recupera pool_size candidatos semánticos y re-rankea por hybrid_score.
        """
        query_emb = self.embed([query])[0]
        emb_str   = _vec(query_emb)

        # Keyword: fault_code tiene prioridad; fallback primer token del query
        keyword    = fault_code if fault_code else (query.split()[0] if query else "")
        kw_pattern = f"%{keyword}%" if keyword else "%"
        pool_size  = top_k * 4  # candidatos semánticos a re-rankear

        sql = text("""
            WITH pool AS (
                SELECT
                    id, content, page, source, lang,
                    1 - (embedding <=> CAST(:emb AS vector)) AS sem_score
                FROM document_chunks
                WHERE model = :model
                ORDER BY embedding <=> CAST(:emb AS vector)
                LIMIT :pool_size
            )
            SELECT *,
                CASE WHEN content ILIKE :kw THEN 1.0 ELSE 0.0 END          AS kw_score,
                0.7 * sem_score
                + 0.3 * CASE WHEN content ILIKE :kw THEN 1.0 ELSE 0.0 END  AS hybrid_score
            FROM pool
            ORDER BY hybrid_score DESC
            LIMIT :top_k
        """)

        with self.engine.connect() as conn:
            rows = conn.execute(sql, {
                "emb":       emb_str,
                "model":     model,
                "pool_size": pool_size,
                "kw":        kw_pattern,
                "top_k":     top_k,
            }).fetchall()

        return [
            {
                "content":        r.content,
                "page":           r.page,
                "source":         r.source,
                "lang":           r.lang,
                "semantic_score": float(r.sem_score),
                "keyword_score":  float(r.kw_score),
                "hybrid_score":   float(r.hybrid_score),
            }
            for r in rows
        ]

    # ── Métricas / introspección ───────────────────────────────────────────────

    def count(self) -> int:
        """Total de chunks en la DB."""
        with self.engine.connect() as conn:
            return conn.execute(text("SELECT COUNT(*) FROM document_chunks")).scalar() or 0

    def model_count(self, model: str) -> int:
        """Chunks indexados para un modelo específico."""
        with self.engine.connect() as conn:
            return conn.execute(
                text("SELECT COUNT(*) FROM document_chunks WHERE model = :m"),
                {"m": model},
            ).scalar() or 0

    def list_models(self) -> list[str]:
        """Lista de modelos disponibles en la DB."""
        with self.engine.connect() as conn:
            rows = conn.execute(
                text("SELECT DISTINCT model FROM document_chunks ORDER BY model")
            ).fetchall()
        return [r[0] for r in rows]
