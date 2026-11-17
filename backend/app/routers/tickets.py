from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Ticket, User
from app.schemas import TicketCreate, TicketResponse, TicketStatusUpdate
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

def serialize_ticket(ticket: Ticket) -> TicketResponse:
    """Konwertuje model Ticket na TicketResponse wzbogacony o login właściciela."""
    return TicketResponse(
        id=ticket.id,
        room=ticket.room,
        workstation_number=ticket.workstation_number,
        category=ticket.category,
        description=ticket.description,
        status=ticket.status,
        priority=ticket.priority,
        created_at=ticket.created_at,
        owner_id=ticket.owner_id,
        owner_username=ticket.owner.username if ticket.owner else "Anonim"
    )

@router.post("", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_data: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tworzy nowe zgłoszenie usterki powiązane z zalogowanym użytkownikiem.
    Wymaga zalogowania (JWT).
    Waliduje numer stanowiska (1-32) oraz ograniczenia znakowe opisu.
    """
    new_ticket = Ticket(
        room=ticket_data.room.strip(),
        workstation_number=ticket_data.workstation_number,
        category=ticket_data.category.strip(),
        description=ticket_data.description.strip(),
        status="new",
        priority="normal",
        owner_id=current_user.id
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return serialize_ticket(new_ticket)

@router.get("", response_model=List[TicketResponse])
def get_tickets(
    room: Optional[str] = Query(None, description="Filtruj według sali"),
    mine: bool = Query(False, description="Zwróć tylko moje zgłoszenia"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Pobiera listę zgłoszeń usterek (wymaga uwierzytelnienia).
    Obsługuje filtrowanie po sali oraz widok wyłącznie własnych zgłoszeń.
    """
    query = db.query(Ticket)

    if mine:
        query = query.filter(Ticket.owner_id == current_user.id)
    if room and room != "ALL":
        query = query.filter(Ticket.room == room)

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return [serialize_ticket(t) for t in tickets]

@router.patch("/{ticket_id}/status", response_model=TicketResponse)
def update_ticket_status(
    ticket_id: int,
    update_data: TicketStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Aktualizacja statusu zgłoszenia.
    - Administrator (opiekun) może nadać dowolny status (new, in_progress, resolved, cancelled) oraz zmienić priorytet.
    - Zwykły uczeń może wyłącznie ANULOWAĆ ('cancelled') WŁASNE zgłoszenie, jeśli jest ono jeszcze nowe.
    Próba modyfikacji cudzego zgłoszenia przez ucznia zostaje odrzucona kodem 403 Forbidden (ochrona przed IDOR).
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zgłoszenie o ID #{ticket_id} nie zostało odnalezione."
        )

    # Sprawdzenie uprawnień (IDOR + RBAC)
    if current_user.role != "admin":
        if ticket.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Brak uprawnień: Nie możesz modyfikować zgłoszenia innego użytkownika (zabezpieczenie IDOR)."
            )
        if update_data.status != "cancelled":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Uczeń ma uprawnienia wyłącznie do anulowania własnego zgłoszenia."
            )
        if ticket.status != "new":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Można anulować wyłącznie zgłoszenia o statusie 'Nowe'."
            )

    ticket.status = update_data.status
    if update_data.priority and current_user.role == "admin":
        ticket.priority = update_data.priority

    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket)

@router.delete("/{ticket_id}", status_code=status.HTTP_200_OK)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Usunięcie zgłoszenia.
    Dostępne wyłącznie dla autora zgłoszenia lub administratora (ochrona przed IDOR).
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Zgłoszenie o ID #{ticket_id} nie istnieje."
        )

    if current_user.role != "admin" and ticket.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Brak uprawnień: Nie możesz usunąć cudzego zgłoszenia (zabezpieczenie IDOR)."
        )

    db.delete(ticket)
    db.commit()
    return {"message": f"Zgłoszenie #{ticket_id} zostało pomyślnie usunięte.", "id": ticket_id}
