import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.getenv("SECRET_KEY", "titbird-super-secret-key-for-development-only-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Bezpieczne rozwiązanie ścieżki do bazy SQLite na Windowsie
db_file = (BASE_DIR / "titbird.db").resolve()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL or "./titbird.db" in DATABASE_URL:
    DATABASE_URL = f"sqlite:///{db_file.as_posix()}"
