from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import tickets, auth

# Tworzenie tabel bazy danych
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TitBird API",
    description="System zgłaszania usterek w pracowniach komputerowych z autoryzacją JWT i RBAC",
    version="0.2.0"
)

# Konfiguracja CORS (umożliwia połączenie z frontendu React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rejestracja routerów
app.include_router(auth.router)
app.include_router(tickets.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "TitBird API", "version": "0.2.0"}
