from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Attendee(Base):
    __tablename__ = "attendees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    ticket_code = Column(String, unique=True, nullable=False, index=True) # mã vé
    
    # flag quan trọng nhất để check vé chợ đen
    is_checked_in = Column(Boolean, default=False) 
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # map vs log
    logs = relationship("CheckInLog", back_populates="attendee", cascade="all, delete-orphan")


class CheckInLog(Base):
    __tablename__ = "checkin_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    attendee_id = Column(Integer, ForeignKey("attendees.id", ondelete="CASCADE"), nullable=False)
    check_time = Column(DateTime, default=datetime.datetime.utcnow)
    
    # status: "Hợp lệ" hoặc "Cảnh báo vé chợ đen"
    status = Column(String, nullable=False) 
    # link file ảnh chụp camera cổng
    image_url = Column(String, nullable=True) 

    attendee = relationship("Attendee", back_populates="logs")
