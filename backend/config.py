from dotenv import load_dotenv
import os

load_dotenv()

LLM_API_KEY: str  = os.environ["LLM_API_KEY"]
LLM_BASE_URL: str = os.getenv("LLM_BASE_URL", "https://openrouter.ai/api/v1")
LLM_MODEL: str    = os.getenv("LLM_MODEL",    "minimax/minimax-m2.5:free")
MANUALS_PATH: str = os.getenv("MANUALS_PATH", "./data/manuals")
DATABASE_URL: str      = os.getenv(
    "DATABASE_URL",
    "postgresql://ancla:ancla@localhost:5432/ancladb",
)

# Mantenemos CHROMA_PATH por compatibilidad con scripts legacy
CHROMA_PATH: str = os.getenv("CHROMA_PATH", "./backend/chroma_db")
