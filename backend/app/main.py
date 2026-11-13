from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import tickets

# Tworzenie tabel bazy danych
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TitBird API",
    description="System zgłaszania usterek w pracowniach komputerowych",
    version="0.1.0"
)

# Konfiguracja CORS (umożliwia połączenie z frontendu React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "TitBird API"}
