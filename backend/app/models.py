from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    room = Column(String(20), nullable=False)
    workstation_number = Column(Integer, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), default="new", nullable=False)  # new, in_progress, resolved, cancelled
    priority = Column(String(20), default="normal", nullable=False)  # low, normal, high
    created_at = Column(DateTime, default=utc_now, nullable=False)
