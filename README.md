# BTL: Hệ thống Check-in Sự kiện và Chống Vé Chợ Đen dựa trên Nhận diện Khuôn mặt

![Python](https://img.shields.io/badge/Python-3.13.7-red)
![Course](https://img.shields.io/badge/Course-AI_System_Development_Practice-green)
![School](https://img.shields.io/badge/School-UET_VNU-blue)

**Môn học:** Thực hành phát triển hệ thống trí tuệ nhân tạo - AIT3004_4

**Học kỳ:** 2, 2025–2026

**Trường:** Đại học Công nghệ, ĐHQG Hà Nội (UET-VNU)

---

## Thông tin Giảng viên và Sinh viên

**Nhóm Giảng viên hướng dẫn & đánh giá:**
- ThS. Nguyễn Hải Toàn (Toan-Nguyen26)

**Sinh viên thực hiện:**
- Tên sinh viên: Đinh Mạnh Cường
- Mã sinh viên: 24022274
- Vai trò: Phát triển Full-stack, Cấu hình luồng xử lý AI và Triển khai hạ tầng (System Architecture & DevOps)

---

## Mục lục
1. [Giới thiệu dự án](#1-giới-thiệu-dự-án)
2. [Cấu trúc thư mục](#2-cấu-trúc-thư-mục)
3. [Kiến trúc và Công nghệ sử dụng](#3-kiến-trúc-và-công-nghệ-sử-dụng)
4. [Hướng dẫn cài đặt và khởi chạy](#4-hướng-dẫn-cài-đặt-và-khởi-chạy)
5. [Luồng xử lý nghiệp vụ chính](#5-luồng-xử-lý-nghiệp-vụ-chính)
6. [Khắc phục sự cố](#6-khắc-phục-sự-cố)

---

## 1. Giới thiệu dự án

Dự án này là một hệ thống Full-stack ứng dụng trí tuệ nhân tạo (AI) trong việc kiểm soát vé sự kiện thông qua nhận diện khuôn mặt thời gian thực. Hệ thống được thiết kế để giải quyết bài toán "vé chợ đen" (một người mua vé sau đó bán lại hoặc sao chép mã cho nhiều người sử dụng). 

Thay vì sử dụng mã QR hay vé giấy truyền thống, hệ thống định danh sinh trắc học trực tiếp người sở hữu vé ngay tại thời điểm đăng ký. Khi tiến hành check-in tại cổng sự kiện, thuật toán sẽ đối chiếu khuôn mặt và khóa trạng thái vé ngay lập tức sau khi xác thực thành công, từ chối mọi nỗ lực sử dụng lại vé đã kích hoạt.

**Mục tiêu kỹ thuật cốt lõi:**
- Xây dựng kiến trúc phần mềm hướng dịch vụ, phân tách rõ ràng các tầng logic.
- Đóng gói toàn bộ hệ thống bằng Docker Compose, cho phép triển khai nhanh chóng (one-click deployment).
- Xử lý các tác vụ máy học nặng (trích xuất đặc trưng khuôn mặt) thông qua Message Queue và Background Worker để đảm bảo tính sẵn sàng cao cho API chính.
- Tối ưu hóa lưu trữ đa lớp: Cơ sở dữ liệu quan hệ (PostgreSQL), Cơ sở dữ liệu Vector (Qdrant), và Hệ thống lưu trữ đối tượng (MinIO).

---

## 2. Cấu trúc thư mục

```text
btl-event-checkin/
├── backend/                    # Core System (API & AI Worker)
│   ├── Dockerfile              # Chỉ dẫn đóng gói Docker cho Python Backend
│   ├── requirements.txt        # Các thư viện phụ thuộc (FastAPI, DeepFace, RetinaFace...)
│   ├── main.py                 # Logic xử lý API chính (FastAPI)
│   ├── models.py               # Lược đồ cơ sở dữ liệu (Database Schema)
│   ├── database.py             # Cấu hình kết nối PostgreSQL, MinIO
│   └── worker.py               # Trình xử lý tác vụ nền (RabbitMQ Consumer)
│
├── frontend_web/               # Giao diện người dùng và quản trị
│   ├── Dockerfile              # Chỉ dẫn đóng gói Docker cho Frontend (Nginx)
│   ├── index.html              # Kiosk Check-in sự kiện (Camera Client)
│   └── admin.html              # Bảng điều khiển quản trị viên (Đăng ký vé)
│
├── nginx/                      # Bộ cân bằng tải và Điều phối
│   └── nginx.conf              # Cấu hình Reverse Proxy
│
├── .env.example                # Tệp mẫu cấu hình biến môi trường
├── .gitignore                  # Cấu hình bỏ qua tệp tin trên Git
├── docker-compose.yml          # Tệp tin cấu hình triển khai toàn bộ hệ thống
└── README.md                   # Tài liệu dự 
```

---

## 3. Kiến trúc và Công nghệ sử dụng

Hệ thống được thiết kế theo mô hình Microservices, bao gồm các thành phần giao tiếp với nhau qua mạng nội bộ của Docker:

### Bộ điều phối (Load Balancer & Reverse Proxy)
- **Công nghệ:** Nginx
- **Chức năng:** Điều hướng lưu lượng truy cập; định tuyến `/` cho giao diện người dùng và `/api/` cho các dịch vụ Backend.

### Giao diện lập trình ứng dụng (Backend API)
- **Công nghệ:** FastAPI (Python)
- **Chức năng:** Tiếp nhận hình ảnh từ Camera, xử lý logic kiểm tra vé, truy vấn dữ liệu từ PostgreSQL và so khớp vector từ Qdrant.

### Trình xử lý tác vụ nền (AI Worker)
- **Công nghệ:** Python + Pika
- **Thuật toán AI:** RetinaFace (phát hiện khuôn mặt) + ArcFace (trích xuất vector 512 chiều).
- **Chức năng:** Nhận hình ảnh từ hàng đợi, thực hiện trích xuất vector đặc trưng và lưu vào Qdrant một cách bất đồng bộ để không gây tắc nghẽn luồng API chính.

### Hệ thống hàng đợi thông điệp (Message / Event Queue)
- **Công nghệ:** RabbitMQ
- **Chức năng:** Đóng vai trò Broker trung chuyển nhiệm vụ đăng ký vé từ Backend sang AI Worker.

### Hệ thống lưu trữ đa lớp
- **Lưu trữ quan hệ (PostgreSQL):** Quản lý thông tin khách tham dự, mã vé, trạng thái check-in và nhật ký sự kiện.
- **Lưu trữ Vector (Qdrant):** Lưu trữ và tìm kiếm độ tương đồng Cosine (Cosine Similarity) các vector khuôn mặt với độ trễ thấp.
- **Lưu trữ Đối tượng (MinIO):** Lưu trữ hình ảnh gốc của khách hàng khi đăng ký và ảnh chụp bằng chứng khi check-in tại cổng.

---

## 4. Hướng dẫn cài đặt và khởi chạy

**Yêu cầu hệ thống:**
- Máy chủ hoặc máy tính cá nhân đã cài đặt Docker và Docker Compose.

### Bước 1: Khởi tạo mã nguồn

```bash
git clone [Đường_dẫn_repository_của_nhóm]
cd [Thư_mục_repository]
```

### Bước 2: Cấu hình biến môi trường

Tạo tệp `.env` từ tệp mẫu `.env.example` để thiết lập các thông tin bảo mật (tuyệt đối không commit tệp `.env` lên hệ thống quản lý phiên bản).

```bash
cp .env.example .env
```

(Lưu ý: Có thể giữ nguyên các giá trị mặc định trong `.env.example` để kiểm thử cục bộ). 

### Bước 3: Khởi chạy hệ thống

Sử dụng Docker Compose để biên dịch và chạy toàn bộ kiến trúc dịch vụ (PostgreSQL, Qdrant, MinIO, RabbitMQ, Backend, Worker, Frontend, Nginx).

Mở terminal tại thư mục gốc của dự án và thực thi lệnh sau:

```bash
docker-compose up -d --build
```

### Bước 4: Truy cập các dịch vụ

Sau khi hệ thống khởi động hoàn tất, truy cập các địa chỉ sau thông qua trình duyệt:

* **Kiosk Check-in (Khách tham dự):** [http://localhost](http://localhost)
* **Giao diện Quản trị viên (Ban tổ chức):** [http://localhost/admin.html](http://localhost/admin.html)
* **Tài liệu API (Swagger UI):** [http://localhost/api/docs](http://localhost/api/docs)
* **Bảng điều khiển MinIO:** [http://localhost:9001](http://localhost:9001)
* **Bảng điều khiển RabbitMQ:** [http://localhost:15672](http://localhost:15672)

---

## 5. Luồng xử lý nghiệp vụ chính

### Giai đoạn 1: Đăng ký vé sự kiện (Tại giao diện Admin)
* Quản trị viên nhập thông tin khách hàng, cấp mã vé và tải lên ảnh khuôn mặt.
* Dữ liệu văn bản được lưu vào PostgreSQL với biến đánh dấu trạng thái check-in.
* Hình ảnh gốc được chuyển lên MinIO Object Storage.
* Tác vụ trích xuất khuôn mặt được đẩy vào hàng đợi RabbitMQ.
* AI Worker nhận tác vụ từ hàng đợi, sử dụng thuật toán ArcFace để trích xuất vector 512 chiều và lưu vào Qdrant cùng siêu dữ liệu (mã vé).

### Giai đoạn 2: Trích xuất và Check-in (Tại cổng sự kiện)
* Khách hàng đứng trước Camera Kiosk, hệ thống gửi hình ảnh trực tiếp qua Backend.
* Bộ nhận diện RetinaFace xác định tọa độ khuôn mặt và ArcFace tính toán vector đặc trưng.
* Vector được truy vấn trong không gian đa chiều của Qdrant (sử dụng khoảng cách Cosine) để tìm kiếm mã vé tương ứng.
* **Kiểm tra trạng thái vé (Logic Chống vé chợ đen):**
    * **Trường hợp vé hợp lệ (Chưa check-in):** Hệ thống cấp quyền truy cập, hiển thị thông báo thành công, khóa vé bằng cách thay đổi trạng thái trong CSDL quan hệ, và lưu ảnh chụp vào MinIO làm bằng chứng.
    * **Trường hợp vé không hợp lệ (Đã check-in):** Hệ thống kích hoạt cảnh báo an ninh, thông báo vé đã được sử dụng trước đó, từ chối mở cổng.

---

## 6. Khắc phục sự cố

* **Lỗi không nhận diện được camera:** Đảm bảo trình duyệt được cấp quyền truy cập thiết bị thu hình (webcam/camera) khi truy cập [http://localhost](http://localhost).
* **Hệ thống phản hồi chậm trong lần đầu truy cập:** Do ứng dụng Backend cần khởi tạo (warm-up) mô hình AI ArcFace và RetinaFace vào bộ nhớ đệm trong yêu cầu xử lý đầu tiên. Các yêu cầu tiếp theo sẽ diễn ra tức thời.
* **Xung đột cổng (Port conflict):** Kiểm tra và dừng các tiến trình đang sử dụng các cổng `80`, `5432`, `6333`, `9000`, `9001`, `5672`, `15672` trên máy chủ trước khi thực thi Docker Compose.

*(Tài liệu này được biên soạn nhằm phục vụ mục đích báo cáo chuyên môn. Vui lòng tham khảo mã nguồn chi tiết trong các thư mục tương ứng).*
