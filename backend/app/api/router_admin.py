from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
import pika
import json
import shutil
import traceback

from app.models.database import get_db
from app.models import schemas
from app.core.config import settings

router = APIRouter()

@router.post("/add_attendee")
async def add_attendee(
    name: str = Form(...), 
    ticket_code: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Kiểm tra tính duy nhất của mã vé
        exist_ticket = db.query(schemas.Attendee).filter(schemas.Attendee.ticket_code == ticket_code).first()
        if exist_ticket:
            return {"status": "error", "message": "Mã vé này đã tồn tại trong hệ thống!"}

        # Lưu thông tin định danh
        new_attendee = schemas.Attendee(name=name, ticket_code=ticket_code)
        db.add(new_attendee)
        db.commit()
        db.refresh(new_attendee)

        file_path = f"temp_images/ticket_{ticket_code}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Giao tiếp qua RabbitMQ Message Queue
        credentials = pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD)
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=settings.MQ_HOST, credentials=credentials)
        )
        channel = connection.channel()
        channel.queue_declare(queue='ticket_processing')

        message = {"name": name, "ticket_code": ticket_code, "image_path": file_path}
        channel.basic_publish(exchange='', routing_key='ticket_processing', body=json.dumps(message))
        connection.close()

        return {
            "status": "success", 
            "id": new_attendee.id, 
            "message": "Đã lưu thông tin và đẩy tác vụ phân tích khuôn mặt vào hàng đợi."
        }
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return {"status": "error", "message": f"Lỗi hệ thống: {str(e)}"}


@router.get("/logs")
def get_checkin_logs(db: Session = Depends(get_db)):
    logs = db.query(schemas.CheckInLog).order_by(schemas.CheckInLog.check_time.desc()).all()
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "attendee_name": log.attendee.name,
            "ticket_code": log.attendee.ticket_code,
            "check_time": log.check_time.strftime("%Y-%m-%d %H:%M:%S"),
            "status": log.status,
            "image_url": log.image_url
        })
    return result


@router.get("/attendees")
def get_all_attendees(db: Session = Depends(get_db)):
    attendees = db.query(schemas.Attendee).all()
    return [{
        "id": a.id, 
        "name": a.name, 
        "ticket_code": a.ticket_code, 
        "is_checked_in": a.is_checked_in
    } for a in attendees]
