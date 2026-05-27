# 🏢 Hệ Thống Kiosk Chấm Công Bằng Khuôn Mặt AI (Face Recognition Time & Attendance)

**Môn học:** Thực hành phát triển hệ thống trí tuệ nhân tạo (Học kỳ 2, 2025–2026)  
**Trường:** Đại học Công nghệ, ĐHQG Hà Nội  
**Thành viên thực hiện:** - Đinh Mạnh Cường (Nhóm trưởng)
- [Điền tên thành viên 2 - nếu có]
- [Điền tên thành viên 3 - nếu có]
- [Điền tên thành viên 4 - nếu có]

---

## 🌟 Tổng quan Dự án (Nhiệm vụ 1: Nhận diện khuôn mặt)
Dự án này xây dựng một hệ thống **Kiosk Chấm công thời gian thực** (Time & Attendance Kiosk) dành cho doanh nghiệp. Khác với các hệ thống điểm danh truyền thống, dự án áp dụng kiến trúc Microservices và mô hình AI ArcFace để tự động nhận diện nhân sự, chống gian lận (Liveness Detection), và quản lý lịch sử ra vào một cách chính xác.

### Các tính năng cốt lõi:
- **Kiosk Thời gian thực:** Nhận diện khuôn mặt tự động ngay khi nhân viên bước vào khung hình (Không cần bấm nút).
- **Liveness Detection & Gatekeeper:** Phát hiện và loại bỏ nỗ lực giả mạo (dùng ảnh điện thoại/giấy) thông qua phân tích ảnh hồng ngoại (IR) và thuật toán phân tích phương sai Laplacian. Bộ lọc Gatekeeper giúp loại bỏ nhiễu từ người đi lướt qua.
- **Nghiệp vụ Chấm công Thông minh:** Tự động phân biệt Check-in (Sáng) / Check-out (Chiều); đánh giá trạng thái Đúng giờ/Đi muộn/Về sớm; tích hợp logic Debounce chống Spam dữ liệu liên tục trong 5 phút.
- **Lưu trữ bằng chứng:** Mỗi lượt quét thành công đều tự động trích xuất và đẩy ảnh chụp lên không gian lưu trữ Object Storage.
- **Admin Dashboard:** Giao diện quản trị an toàn giúp HR theo dõi nhật ký chấm công trực tiếp và đăng ký khuôn mặt nhân sự mới qua Webcam/Upload.

---

## 🏗️ Kiến trúc Hệ thống (Full-stack Architecture)

Hệ thống được đóng gói hoàn toàn bằng Docker Compose, bao gồm 8 container phối hợp nhịp nhàng:

| Thành phần | Công nghệ sử dụng | Chức năng trong hệ thống |
| :--- | :--- | :--- |
| **Reverse Proxy** | `Nginx` | Load Balancer điều phối luồng truy cập tại cổng `80` (chia nhánh `/` cho Web và `/api/` cho Backend API). |
| **AI Backend API** | `FastAPI` (Python) | Xử lý logic chấm công, chạy model OpenCV (Gatekeeper) & DeepFace (ArcFace). |
| **Background Worker** | `Python` (Pika) | Chạy ngầm, nhận thông điệp từ RabbitMQ để nhúng vector khuôn mặt không làm nghẽn luồng chính. |
| **Relational DB** | `PostgreSQL` | Quản lý thông tin hồ sơ nhân viên và nhật ký chấm công (Thời gian, Trạng thái). |
| **Vector DB** | `Qdrant` | Lưu trữ và so khớp vector đặc trưng 512-chiều sinh ra từ ArcFace với tốc độ mili-giây. |
| **Object Storage** | `MinIO` | Lưu trữ file ảnh vật lý (Bằng chứng chấm công, Ảnh gốc đăng ký). |
| **Message Queue** | `RabbitMQ` | Hàng đợi tin nhắn bất đồng bộ, trung chuyển task từ Backend sang Worker. |
| **Frontend Web** | `HTML, Tailwind, DaisyUI` | Giao diện tương tác người dùng (Kiosk Camera & Bảng điều khiển Admin). |

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy

### 1. Khởi chạy hệ thống nội bộ
Chỉ với 1 câu lệnh duy nhất, toàn bộ kiến trúc 8 container sẽ được xây dựng và khởi động:
```bash
docker-compose up -d --build
