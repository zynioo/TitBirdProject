from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="student", nullable=False)  # "student", "admin"
    created_at = Column(DateTime, default=utc_now, nullable=False)

    tickets = relationship("Ticket", back_populates="owner", cascade="all, delete-orphan")

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

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    owner = relationship("User", back_populates="tickets")
