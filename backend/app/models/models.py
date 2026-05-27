from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from datetime import timezone
from app.models.database import Base

class Attendee(Base):
    __tablename__ = "attendees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    ticket_code = Column(String, unique=True, nullable=False, index=True)
    is_checked_in = Column(Boolean, default=False) 
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(timezone.utc))

    # Moi quan he voi bang log checkin, tu dong xoa neu attendee bi xoa
    logs = relationship("CheckInLog", back_populates="attendee", cascade="all, delete-orphan")


class CheckInLog(Base):
    __tablename__ = "checkin_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    attendee_id = Column(Integer, ForeignKey("attendees.id", ondelete="CASCADE"), nullable=False)
    check_time = Column(DateTime, default=lambda: datetime.datetime.now(timezone.utc))
    status = Column(String, nullable=False) 
    image_url = Column(String, nullable=True) 

    # Moi quan he nguoc lai voi bang attendee
    attendee = relationship("Attendee", back_populates="logs")
