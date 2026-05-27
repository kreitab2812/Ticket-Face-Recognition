from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import pika
import json
import shutil
import traceback
import uuid
import os
from typing import List

from app.models.database import get_db
# Import ca models (cho Database) va schemas (cho API Validation)
from app.models import models, schemas 
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
        exist_ticket = ticket_service.get_attendee_by_ticket(db, ticket_code)
        if exist_ticket:
            return {"status": "error", "message": "Ma ve nay da ton tai trong he thong!"}

        # Fix bao mat Path Traversal: Tao ten file tu ma ve va UUID
        file_ext = os.path.splitext(file.filename)[1]
        safe_filename = f"ticket_{ticket_code}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = f"temp_images/{safe_filename}"
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        profile_image_url = vision_service.upload_image_to_minio(file_path, prefix="profiles")

        new_attendee = models.Attendee(name=name, ticket_code=ticket_code)
        db.add(new_attendee)
        db.commit()
        db.refresh(new_attendee)

        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=settings.MQ_HOST,
                credentials=pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD)
            )
        )
        channel = connection.channel()
        channel.queue_declare(queue='ticket_processing')

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

# Tich hop response_model de FastAPI tu dong format Json theo dinh dang an toan
@router.get("/logs", response_model=List[schemas.CheckInLogResponse])
def get_checkin_logs(db: Session = Depends(get_db)):
    logs = db.query(models.CheckInLog).order_by(models.CheckInLog.check_time.desc()).all()
    return logs

@router.get("/attendees", response_model=List[schemas.AttendeeResponse])
def get_attendees(db: Session = Depends(get_db)):
    attendees = db.query(models.Attendee).order_by(models.Attendee.created_at.desc()).all()
    return attendees
