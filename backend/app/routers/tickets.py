from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ticket
from app.schemas import TicketCreate, TicketResponse

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(ticket_data: TicketCreate, db: Session = Depends(get_db)):
    """
    Tworzy nowe zgłoszenie usterki.
    Waliduje numer stanowiska (1-32) oraz długość opisu.
    """
    new_ticket = Ticket(
        room=ticket_data.room.strip(),
        workstation_number=ticket_data.workstation_number,
        category=ticket_data.category.strip(),
        description=ticket_data.description.strip(),
        status="new",
        priority="normal"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket

@router.get("", response_model=List[TicketResponse])
def get_tickets(db: Session = Depends(get_db)):
    """
    Pobiera listę wszystkich zgłoszonych usterek posortowaną od najnowszych.
    """
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    return tickets
