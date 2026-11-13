from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class TicketBase(BaseModel):
    room: str = Field(..., min_length=1, max_length=20, description="Numer lub nazwa sali, np. 204")
    workstation_number: int = Field(..., ge=1, le=32, description="Numer stanowiska w sali (1-32)")
    category: str = Field(..., min_length=2, max_length=50, description="Kategoria sprzętu, np. Monitor, Mysz/Klawiatura")
    description: str = Field(..., min_length=5, max_length=2000, description="Dokładny opis usterki")

class TicketCreate(TicketBase):
    pass

class TicketResponse(TicketBase):
    id: int
    status: str
    priority: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
