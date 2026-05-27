from sqlalchemy.orm import Session
from app.models import schemas

def get_attendee_by_ticket(db: Session, ticket_code: str):
    """
    Lay thong tin khach hang dua vao ma ve
    """
    return db.query(schemas.Attendee).filter(schemas.Attendee.ticket_code == ticket_code).first()

def log_checkin_event(db: Session, attendee_id: int, status: str, image_url: str):
    """
    Ghi lai lich su check-in (Bao gom ca hop le va canh bao ve cho den)
    """
    new_log = schemas.CheckInLog(
        attendee_id=attendee_id,
        status=status,
        image_url=image_url
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log
