from sqlalchemy.orm import Session
# Cap nhat import sang models thay vi schemas nhu o Phan cuc 2
from app.models import models

def get_attendee_by_ticket(db: Session, ticket_code: str) -> models.Attendee | None:
    """
    Lay thong tin khach hang dua vao ma ve
    """
    return db.query(models.Attendee).filter(models.Attendee.ticket_code == ticket_code).first()

def log_checkin_event(db: Session, attendee_id: int, status: str, image_url: str) -> models.CheckInLog:
    """
    Ghi lai lich su check-in (Bao gom ca hop le va canh bao ve cho den)
    """
    new_log = models.CheckInLog(
        attendee_id=attendee_id,
        status=status,
        image_url=image_url
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log
