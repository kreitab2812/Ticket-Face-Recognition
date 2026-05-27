from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
import datetime
from database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    status = Column(String, default="Active")  # Active (Đang làm), Inactive (Đã nghỉ)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Thiết lập mối quan hệ với bảng nhật ký chấm công
    logs = relationship("AttendanceLog", back_populates="employee", cascade="all, delete-orphan")


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    check_time = Column(DateTime, default=datetime.datetime.utcnow)
    action_type = Column(String, nullable=False)  # CHECK-IN hoặc CHECK-OUT
    image_url = Column(String, nullable=True)     # Đường dẫn tới file ảnh lưu trên MinIO
    status = Column(String, nullable=False)       # Đúng giờ, Đi muộn, Về sớm

    # Thiết lập mối quan hệ ngược lại với bảng nhân viên
    employee = relationship("Employee", back_populates="logs")
