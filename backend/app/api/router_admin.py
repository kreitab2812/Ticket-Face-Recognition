from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import pika
import json
import traceback
import uuid
import os
from typing import List

from app.models.database import get_db
from app.models import models, schemas 
from app.core.config import settings
from app.services import vision_service, ticket_service

router = APIRouter()

# [FIX CỐT LÕI]: Ép Backend và Worker cùng nhìn vào 1 chỗ
TEMP_DIR = "/code/temp_images"

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

        if not os.path.exists(TEMP_DIR):
            os.makedirs(TEMP_DIR, exist_ok=True)

        file_ext = os.path.splitext(file.filename)[1]
        if not file_ext:
            file_ext = ".jpg" 
            
        safe_filename = f"ticket_{ticket_code}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = f"{TEMP_DIR}/{safe_filename}" # Lưu thẳng vào thư mục chia sẻ
        
        content = await file.read()
        with open(file_path, "wb") as buffer:
            buffer.write(content)

        # 2. Upload MinIO
        profile_image_url = vision_service.upload_image_to_minio(file_path, prefix="profiles")
        
        # [FIX CỐT LÕI]: Nếu MinIO tịt, BÁO LỖI NGAY, không lưu database bậy bạ nữa!
        if not profile_image_url:
            raise Exception("Loi mang: MinIO khong the luu anh. Vui long check lai!")

        # 3. Day vao DB
        new_attendee = models.Attendee(
            name=name, 
            ticket_code=ticket_code,
            image_url=profile_image_url
        )
        db.add(new_attendee)
        db.flush() 

        # 4. Gui RabbitMQ
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

        # 5. MOI THU THANH CONG THI MOI CHOT DB
        db.commit()
        db.refresh(new_attendee)

        return {
            "status": "success", 
            "id": new_attendee.id, 
            "message": "Da luu thong tin, day anh len MinIO va day tac vu vao RabbitMQ."
        }
    except Exception as e:
        db.rollback()
        print(f"\n[!!!] LỖI THÊM KHÁCH: {str(e)}\n", flush=True)
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

@router.get("/logs", response_model=List[schemas.CheckInLogResponse])
def get_checkin_logs(db: Session = Depends(get_db)):
    logs = db.query(models.CheckInLog).order_by(models.CheckInLog.check_time.desc()).all()
    return logs

@router.get("/attendees", response_model=List[schemas.AttendeeResponse])
def get_attendees(db: Session = Depends(get_db)):
    attendees = db.query(models.Attendee).order_by(models.Attendee.created_at.desc()).all()
    return attendees
    
@router.delete("/attendee/{id}")
def delete_attendee(id: int, db: Session = Depends(get_db)):
    attendee = db.query(models.Attendee).filter(models.Attendee.id == id).first()
    if not attendee:
        return {"status": "error", "message": "Khong tim thay khach moi nay"}
    
    try:
        db.query(models.CheckInLog).filter(models.CheckInLog.attendee_id == id).delete()
        db.delete(attendee)
        db.commit()
        return {"status": "success", "message": "Da xoa khach moi thanh cong!"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": f"Loi khi xoa: {str(e)}"}
