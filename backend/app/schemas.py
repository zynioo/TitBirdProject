from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

# Schematy Użytkownika
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, description="Unikalny login użytkownika")

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Hasło użytkownika (min 6 znaków)")
    role: Optional[str] = Field("student", description="Rola: student lub admin")

class UserLogin(BaseModel):
    username: str = Field(..., min_length=1, description="Login użytkownika")
    password: str = Field(..., min_length=1, description="Hasło użytkownika")

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Schematy Zgłoszeń
class TicketBase(BaseModel):
    room: str = Field(..., min_length=1, max_length=20, description="Numer lub nazwa sali, np. Sala 204")
    workstation_number: int = Field(..., ge=1, le=32, description="Numer stanowiska w sali (1-32)")
    category: str = Field(..., min_length=2, max_length=50, description="Kategoria sprzętu, np. Monitor, Mysz/Klawiatura")
    description: str = Field(..., min_length=5, max_length=2000, description="Dokładny opis usterki")

class TicketCreate(TicketBase):
    pass

class TicketStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(new|in_progress|resolved|cancelled)$", description="Nowy status zgłoszenia")
    priority: Optional[str] = Field(None, pattern="^(low|normal|high)$", description="Opcjonalny priorytet zgłoszenia")

class TicketResponse(TicketBase):
    id: int
    status: str
    priority: str
    created_at: datetime
    owner_id: Optional[int] = None
    owner_username: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
