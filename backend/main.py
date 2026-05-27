from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import pika
import json
import shutil
import os
import traceback
import cv2
import numpy as np
import datetime
from deepface import DeepFace
from qdrant_client import QdrantClient

# Kết nối hạ tầng Database & Storage
from database import engine, get_db, minio_client, BUCKET_NAME
import models

app = FastAPI(title="Face Recognition Access Control API")
os.makedirs("temp_images", exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo cấu trúc bảng dữ liệu
models.Base.metadata.create_all(bind=engine)

# Kết nối Vector DB
qdrant = QdrantClient(host="qdrant", port=6333)

# Cấu hình bộ phân tích khuôn mặt siêu nhẹ OpenCV
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def check_face_gatekeeper(image_path):
    """Lọc màn hình trống, chọn khuôn mặt lớn nhất và cắt ảnh tối ưu"""
    img = cv2.imread(image_path)
    if img is None:
        return False, None, "Không thể đọc dữ liệu ảnh."

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))

    if len(faces) == 0:
        return False, None, "Không phát hiện khuôn mặt nào."

    largest_face = max(faces, key=lambda rect: rect[2] * rect[3])
    x, y, w, h = largest_face

    if w < 100:
        return False, None, "Vui lòng đứng gần camera hơn."

    margin = 20
    h_img, w_img = img.shape[:2]
    x1, y1 = max(0, x - margin), max(0, y - margin)
    x2, y2 = min(w_img, x + w + margin), min(h_img, y + h + margin)

    cropped_face = img[y1:y2, x1:x2]
    cropped_path = image_path.replace(".jpg", "_cropped.jpg")
    cv2.imwrite(cropped_path, cropped_face)

    return True, cropped_path, "OK"

def check_ir_liveness(ir_image_path):
    """Phân tích phương sai ảnh hồng ngoại chống giả mạo"""
    img = cv2.imread(ir_image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        return False
    variance = cv2.Laplacian(img, cv2.CV_64F).var()
    return variance > 50

@app.get("/")
def read_root():
    return {"message": "Backend is running với đầy đủ nghiệp vụ!"}

@app.post("/admin/add_employee")
async def add_employee(
    name: str = Form(...), 
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # 1. Ghi nhận thông tin nhân sự vào PostgreSQL trước
        new_employee = models.Employee(name=name, status="Active")
        db.add(new_employee)
        db.commit()
        db.refresh(new_employee)

        # 2. Lưu file ảnh mẫu cục bộ để đưa vào luồng AI ngầm
        file_path = f"temp_images/emp_{new_employee.id}_{file.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 3. Đẩy thông tin qua Message Queue (RabbitMQ) để Worker lưu vào Qdrant
        credentials = pika.PlainCredentials('admin', 'adminpassword')
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
        )
        channel = connection.channel()
        channel.queue_declare(queue='face_processing')

        message = {"name": name, "image_path": file_path}
        channel.basic_publish(exchange='', routing_key='face_processing', body=json.dumps(message))
        connection.close()

        return {
            "status": "success", 
            "id": new_employee.id, 
            "employee": name, 
            "message": "Đã tạo profile hệ thống và đẩy ảnh vào hàng đợi AI."
        }
    except Exception as e:
        db.rollback()
        traceback.print_exc()
        return {"status": "error", "message": f"Lỗi thêm nhân viên: {str(e)}"}

@app.post("/recognize")
async def recognize_face(
    file_rgb: UploadFile = File(...), 
    file_ir: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    rgb_path = f"temp_images/rec_rgb_{file_rgb.filename}"
    ir_path = f"temp_images/rec_ir_{file_ir.filename}"
    
    with open(rgb_path, "wb") as buffer:
        shutil.copyfileobj(file_rgb.file, buffer)
    with open(ir_path, "wb") as buffer:
        shutil.copyfileobj(file_ir.file, buffer)

    try:
        # 1. Gatekeeper kiểm tra sự xuất hiện của cấu trúc khuôn mặt
        is_valid_face, cropped_rgb_path, msg = check_face_gatekeeper(rgb_path)
        if not is_valid_face:
            return {"status": "ignored", "message": msg}

        # 2. Liveness Detection phân tích tầng hồng ngoại thực tế
        if not check_ir_liveness(ir_path):
            return {"status": "error", "message": "Phát hiện giả mạo! Hệ thống từ chối xác thực."}

        # 3. Trích xuất đặc trưng vector bằng mô hình chiến lược ArcFace
        embedding_objs = DeepFace.represent(img_path=cropped_rgb_path, model_name="ArcFace", enforce_detection=False)
        embedding = embedding_objs[0]["embedding"]

        # Tìm kiếm thực thể trùng khớp trong Vector DB
        search_result = qdrant.query_points(
            collection_name="faces_arcface",
            query=embedding,
            limit=1,
            score_threshold=0.5 
        ).points

        if not search_result:
            return {"status": "success", "access": "denied", "employee": "Unknown"}

        # Phát hiện ra danh tính từ vector payload
        matched_name = search_result[0].payload["name"]
        score = search_result[0].score

        # Truy vấn thông tin chi tiết nhân sự từ PostgreSQL
        employee = db.query(models.Employee).filter(
            models.Employee.name == matched_name, 
            models.Employee.status == "Active"
        ).first()

        if not employee:
            return {"status": "success", "access": "denied", "employee": "Unknown (Profile không tồn tại)"}

        # --- XỬ LÝ LOGIC NGHIỆP VỤ CHẤM CÔNG ---
        now = datetime.datetime.now()
        today_start = datetime.datetime.combine(now.date(), datetime.time.min)
        today_end = datetime.datetime.combine(now.date(), datetime.time.max)

        # Kiểm tra lịch sử chấm công của nhân viên trong ngày hôm nay
        last_log = db.query(models.AttendanceLog).filter(
            models.AttendanceLog.employee_id == employee.id,
            models.AttendanceLog.check_time >= today_start,
            models.AttendanceLog.check_time <= today_end
        ).order_by(models.AttendanceLog.check_time.desc()).first()

        # Luật 1: Chống Spam nhận diện trùng lặp (Giới hạn khoảng cách 5 phút)
        if last_log:
            time_delta = now - last_log.check_time
            if time_delta.total_seconds() < 300:
                return {
                    "status": "ignored", 
                    "message": f"Nhân viên {employee.name} vừa chấm công cách đây ít phút."
                }

        # Luật 2: Phân biệt Check-in / Check-out và Tính toán đi muộn / về sớm
        if not last_log:
            action_type = "CHECK-IN"
            # Quy định mốc vào ca muộn nhất là 08:30 AM
            attendance_status = "Đúng giờ" if now.time() <= datetime.time(8, 30) else "Đi muộn"
        else:
            action_type = "CHECK-OUT"
            # Quy định mốc tan ca sớm nhất là 05:30 PM (17:30)
            attendance_status = "Đúng giờ" if now.time() >= datetime.time(17, 30) else "Về sớm"

        # Luật 3: Tải ảnh bằng chứng lên MinIO Object Storage
        object_name = f"attendance/emp_{employee.id}_{now.strftime('%Y%m%d_%H%M%S')}.jpg"
        minio_client.fput_object(BUCKET_NAME, object_name, cropped_rgb_path)
        image_url = f"http://127.0.0.1:9000/{BUCKET_NAME}/{object_name}"

        # 4. Ghi dữ liệu nhật ký chấm công chính thức xuống PostgreSQL
        new_log = models.AttendanceLog(
            employee_id=employee.id,
            check_time=now,
            action_type=action_type,
            image_url=image_url,
            status=attendance_status
        )
        db.add(new_log)
        db.commit()

        return {
            "status": "success",
            "access": "granted",
            "employee": employee.name,
            "action": action_type,
            "attendance_status": attendance_status,
            "time": now.strftime("%H:%M:%S"),
            "score": score
        }
        
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "message": f"Hệ thống gặp lỗi: {str(e)}"}

# --- THÊM MỚI CÁC API PHỤC VỤ TRANG QUẢN TRỊ ADMIN ---
@app.get("/admin/logs")
def get_attendance_logs(db: Session = Depends(get_db)):
    """Lấy toàn bộ nhật ký chấm công hiển thị ra trang quản trị"""
    logs = db.query(models.AttendanceLog).order_by(models.AttendanceLog.check_time.desc()).all()
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "employee_name": log.employee.name,
            "check_time": log.check_time.strftime("%Y-%m-%d %H:%M:%S"),
            "action_type": log.action_type,
            "status": log.status,
            "image_url": log.image_url
        })
    return result

@app.get("/admin/employees")
def get_all_employees(db: Session = Depends(get_db)):
    """Lấy danh sách toàn bộ nhân sự"""
    employees = db.query(models.Employee).all()
    return [{"id": emp.id, "name": emp.name, "status": emp.status} for emp in employees]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
