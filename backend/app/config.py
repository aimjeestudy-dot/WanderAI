import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend root if it exists
backend_dir = Path(__file__).resolve().parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path, override=True)

class Settings:
    PROJECT_NAME: str = "Personalized Travel Itinerary Planner"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    @property
    def GEMINI_API_KEY(self) -> str:
        load_dotenv(dotenv_path=env_path, override=True)
        return os.getenv("GEMINI_API_KEY", "").strip()

    @property
    def GEMINI_MODEL(self) -> str:
        load_dotenv(dotenv_path=env_path, override=True)
        return os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

    @property
    def GEMINI_TIMEOUT_SECONDS(self) -> float:
        """Allow realistic AI generation times while protecting against hanging requests."""
        load_dotenv(dotenv_path=env_path, override=True)
        raw_timeout = os.getenv("GEMINI_TIMEOUT_SECONDS", "30").strip()
        try:
            return max(1.0, min(float(raw_timeout), 60.0))
        except ValueError:
            return 30.0

    @property
    def SUPABASE_URL(self) -> str:
        load_dotenv(dotenv_path=env_path, override=True)
        return os.getenv("SUPABASE_URL", "").strip().rstrip("/")

    @property
    def SUPABASE_ANON_KEY(self) -> str:
        return os.getenv("SUPABASE_ANON_KEY", "").strip()

    @property
    def SUPABASE_SERVICE_ROLE_KEY(self) -> str:
        return os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()

    # Local fallback storage path when Supabase is not connected
    LOCAL_STORAGE_FILE: Path = backend_dir / "data" / "saved_itineraries.json"

    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"  # Allows easy local development and Vercel previews
    ]

settings = Settings()
