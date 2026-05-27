from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import pika
import json
import shutil
import os
import traceback
import datetime
from deepface import DeepFace
from qdrant_client import QdrantClient

# import tu file database.py va models.py
from database import engine, get_db, minio_client, BUCKET_NAME
import models

app = FastAPI(title="Event Check-in System API")
os.makedirs("temp_images", exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# tao bang neu chua co
models.Base.metadata.create_all(bind=engine)

# connect Qdrant
qdrant = QdrantClient(host="qdrant", port=6333)

# Warm-up model ArcFace luc khoi dong server de request dau tien khong bi lag
@app.on_event("startup")
def startup_event():
    print("[*] Dang warm-up model AI...")
    try:
        DeepFace.build_model("ArcFace")
        DeepFace.build_model("RetinaFace")
    except:
        pass


@app.get("/")
def read_root():
    return {"message": "Backend check-in su kien is running!"}


@app.post("/admin/add_attendee")
async def add_attendee(
    name: str = Form(...), 
    ticket_code: str = Form(...), # them ma ve
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # 1. Luu khach vao postgres
        # check xem ma ve ton tai chua
        exist_ticket = db.query(models.Attendee).filter(models.Attendee.ticket_code == ticket_code).first()
        if exist_ticket:
            return {"status": "error", "message": "Ma ve nay da ton tai trong he thong!"}

        new_attendee = models.Attendee(name=name, ticket_code=ticket_code)
        db.add(new_attendee)
        db.commit()
        db.refresh(new_attendee)

        # 2. Luu file anh tam thoi
        file_path = f"temp_images/ticket_{ticket_code}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Ban event sang RabbitMQ cho worker chay ngam
        credentials = pika.PlainCredentials('admin', 'adminpassword')
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
        )
        channel = connection.channel()
        channel.queue_declare(queue='ticket_processing')

        # gui ca ticket_code sang de worker luu vao payload Qdrant
        message = {"name": name, "ticket_code": ticket_code, "image_path": file_path}
        channel.basic_publish(exchange='', routing_key='ticket_processing', body=json.dumps(message))
        connection.close()

        return {
            "status": "success", 
            "id": new_attendee.id, 
            "message": "Da luu khach tham du va day vao hang doi AI."
        }
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return {"status": "error", "message": f"Loi he thong: {str(e)}"}


@app.post("/check-in")
async def check_in_event(
    file_rgb: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    # Bo file IR di vi lam web ko truy cap dc
    rgb_path = f"temp_images/checkin_{file_rgb.filename}"
    
    with open(rgb_path, "wb") as buffer:
        shutil.copyfileobj(file_rgb.file, buffer)

    try:
        # 1. Extract vector bang ArcFace + RetinaFace (xac suat bat mat cuc chuan)
        try:
            embedding_objs = DeepFace.represent(
                img_path=rgb_path, 
                model_name="ArcFace", 
                detector_backend="retinaface", # thay cho cai haarcascade cùi bắp
                enforce_detection=True
            )
            embedding = embedding_objs[0]["embedding"]
        except ValueError:
            return {"status": "error", "message": "Khong tim thay khuon mat hop le trong camera."}

        # 2. Tim Kiem Vector trong Qdrant
        search_result = qdrant.query_points(
            collection_name="faces_arcface",
            query=embedding,
            limit=1,
            score_threshold=0.5 
        ).points

        if not search_result:
            return {"status": "denied", "message": "Khong tim thay thong tin ve tren he thong!"}

        # Lay ticket_code tu Qdrant thay vi name
        matched_ticket_code = search_result[0].payload["ticket_code"]
        
        # 3. Check du lieu trong Postgres
        attendee = db.query(models.Attendee).filter(models.Attendee.ticket_code == matched_ticket_code).first()

        if not attendee:
            return {"status": "denied", "message": "Loi dong bo db: Khong tim thay thong tin khach."}

        # --- LOGIC CHONG VE CHO DEN ---
        now = datetime.datetime.now()
        
        if attendee.is_checked_in == True:
            # Ve da xai -> bao dong do
            checkin_status = "Cảnh báo vé chợ đen"
            access = "denied"
            msg = f"CẢNH BÁO: Vé {attendee.ticket_code} của {attendee.name} đã được sử dụng trước đó!"
        else:
            # Ve moi -> cho qua
            attendee.is_checked_in = True 
            checkin_status = "Hợp lệ"
            access = "granted"
            msg = f"Check-in thanh cong! Xin chao {attendee.name}."

        # 4. Upload anh chup camera len Minio lam bang chung
        object_name = f"event-logs/{attendee.ticket_code}_{now.strftime('%Y%m%d_%H%M%S')}.jpg"
        minio_client.fput_object(BUCKET_NAME, object_name, rgb_path)
        image_url = f"http://127.0.0.1:9000/{BUCKET_NAME}/{object_name}"

        # 5. Ghi log
        new_log = models.CheckInLog(
            attendee_id=attendee.id,
            check_time=now,
            image_url=image_url,
            status=checkin_status
        )
        db.add(new_log)
        db.commit()

        return {
            "status": "success",
            "access": access,
            "message": msg,
            "attendee": attendee.name,
            "ticket_code": attendee.ticket_code,
            "time": now.strftime("%H:%M:%S")
        }
        
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": f"He thong gap loi: {str(e)}"}


# --- API ADMIN ---
@app.get("/admin/logs")
def get_checkin_logs(db: Session = Depends(get_db)):
    logs = db.query(models.CheckInLog).order_by(models.CheckInLog.check_time.desc()).all()
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

@app.get("/admin/attendees")
def get_all_attendees(db: Session = Depends(get_db)):
    attendees = db.query(models.Attendee).all()
    return [{
        "id": a.id, 
        "name": a.name, 
        "ticket_code": a.ticket_code, 
        "is_checked_in": a.is_checked_in
    } for a in attendees]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
