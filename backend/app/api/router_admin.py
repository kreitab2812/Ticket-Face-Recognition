from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import pika
import json
import shutil
import traceback

from app.models.database import get_db
from app.models import schemas
from app.core.config import settings
from app.services import vision_service, ticket_service

router = APIRouter()

@router.post("/add_attendee")
async def add_attendee(
    name: str = Form(...), 
    ticket_code: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Kiem tra tinh duy nhat cua ma ve
        exist_ticket = ticket_service.get_attendee_by_ticket(db, ticket_code)
        if exist_ticket:
            return {"status": "error", "message": "Ma ve nay da ton tai trong he thong!"}

        # Luu file vao thu muc tam de xu ly
        file_path = f"temp_images/ticket_{ticket_code}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # FIX BUG: Upload anh ho so goc len MinIO 
        profile_image_url = vision_service.upload_image_to_minio(file_path, prefix="profiles")

        # Luu thong tin dinh danh vao DB
        new_attendee = schemas.Attendee(name=name, ticket_code=ticket_code)
        db.add(new_attendee)
        db.commit()
        db.refresh(new_attendee)

        # Giao tiep qua RabbitMQ Message Queue de day sang AI Worker xu ly Vector
        credentials = pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=settings.MQ_HOST, credentials=credentials)
        )
        channel = connection.channel()
        channel.queue_declare(queue='ticket_processing')

        # Gui duong dan file tam cho Worker xu ly. Worker se tu xoa file tam nay
        message = {"name": name, "ticket_code": ticket_code, "image_path": file_path}
        channel.basic_publish(exchange='', routing_key='ticket_processing', body=json.dumps(message))
        connection.close()

        return {
            "status": "success", 
            "id": new_attendee.id, 
            "message": "Da luu thong tin, day anh len MinIO va day tac vu vao RabbitMQ."
        }
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return {"status": "error", "message": f"Loi he thong: {str(e)}"}


@router.get("/logs")
def get_checkin_logs(db: Session = Depends(get_db)):
    logs = db.query(schemas.CheckInLog).order_by(schemas.CheckInLog.check_time.desc()).all()
    return [{
        "id": log.id,
        "attendee_name": log.attendee.name,
        "ticket_code": log.attendee.ticket_code,
        "check_time": log.check_time.strftime("%Y-%m-%d %H:%M:%S"),
        "status": log.status,
        "image_url": log.image_url
    } for log in logs]


@router.get("/attendees")
def get_all_attendees(db: Session = Depends(get_db)):
    attendees = db.query(schemas.Attendee).all()
    return [{
        "id": a.id, 
        "name": a.name, 
        "ticket_code": a.ticket_code, 
        "is_checked_in": a.is_checked_in
    } for a in attendees]
