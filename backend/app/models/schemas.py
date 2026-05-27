from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.models.database import Base

class Attendee(Base):
    __tablename__ = "attendees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    ticket_code = Column(String, unique=True, nullable=False, index=True)
    
    # Bien trang thai phuc vu logic kiem soat ve cho den
    is_checked_in = Column(Boolean, default=False) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Quan he 1-N voi bang CheckInLog
    logs = relationship("CheckInLog", back_populates="attendee", cascade="all, delete-orphan")


class CheckInLog(Base):
    __tablename__ = "checkin_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Khoa ngoai lien ket voi bang attendees, ondelete CASCADE giup tu xoa log neu xoa khach hang
    attendee_id = Column(Integer, ForeignKey("attendees.id", ondelete="CASCADE"), nullable=False)
    check_time = Column(DateTime, default=datetime.datetime.utcnow)
    
    status = Column(String, nullable=False) 
    image_url = Column(String, nullable=True) 

    attendee = relationship("Attendee", back_populates="logs")
