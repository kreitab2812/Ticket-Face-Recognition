# BTL: Hệ thống Check-in Sự kiện và Chống Vé Chợ Đen dựa trên Nhận diện Khuôn mặt (Enterprise Edition)

![Python](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-ReactJS-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Deployment-Docker-2496ED?logo=docker&logoColor=white)
![Course](https://img.shields.io/badge/Course-AI_System_Development_Practice-green)
![School](https://img.shields.io/badge/School-UET_VNU-blue)

**Môn học:** Thực hành phát triển hệ thống trí tuệ nhân tạo - AIT3004_4  
**Học kỳ:** 2, 2025–2026  
**Trường:** Đại học Công nghệ, ĐHQG Hà Nội (UET-VNU)  

---

## 👥 Thông tin Giảng viên và Sinh viên

**Giảng viên hướng dẫn:**
- ThS. Nguyễn Hải Toàn 
- CN. Hoàng Phi Hùng
- CN. Long Trí Thái Sơn

**Sinh viên thực hiện:**
- Tên sinh viên: Đinh Mạnh Cường
- Mã sinh viên: 24022274
- Vai trò: Phát triển Full-stack, Cấu hình luồng xử lý AI, Triển khai hạ tầng (System Architecture & DevOps) và Tối ưu hóa UI/UX.

---

## 📑 Mục lục
1. [Tóm tắt dự án (Abstract)](#1-tóm-tắt-dự-án-abstract)
2. [Kiến trúc Hệ thống (System Architecture)](#2-kiến-trúc-hệ-thống-system-architecture)
3. [Ứng dụng Trí tuệ Nhân tạo (AI Models)](#3-ứng-dụng-trí-tuệ-nhân-tạo-ai-models)
4. [Điểm nhấn Kỹ thuật (Technical Highlights)](#4-điểm-nhấn-kỹ-thuật-technical-highlights)
5. [Hướng dẫn Cài đặt & Vận hành (Deployment)](#5-hướng-dẫn-cài-đặt--vận-hành-deployment)
6. [Kịch bản Kiểm thử (Test Cases)](#6-kịch-bản-kiểm-thử-test-cases)
7. [Khắc phục sự cố (Troubleshooting)](#7-khắc-phục-sự-cố-troubleshooting)

---

## 1. Tóm tắt dự án (Abstract)

Việc sử dụng vé giấy hoặc mã QR trong các sự kiện quy mô lớn thường tồn tại lỗ hổng an ninh nghiêm trọng, tiêu biểu là vấn nạn vé chợ đen, làm giả vé và quay vòng vé (Ticket Looping). 

Dự án này đề xuất và xây dựng một **Hệ thống Kiểm soát Sinh trắc học (Biometric Kiosk)** tự động theo tiêu chuẩn doanh nghiệp. Cốt lõi của giải pháp là việc định danh duy nhất một mã vé với một khuôn mặt thực thể sống. Bằng việc áp dụng kiến trúc **Microservices**, cơ sở dữ liệu Vector (Qdrant), giao thức Real-time WebSockets và đặc biệt là kiến trúc **Hybrid AI** (kết hợp xử lý AI tại Edge/Client và Server), hệ thống cho phép quét khuôn mặt, chống giả mạo hình ảnh (Liveness Detection) và phát hiện gian lận với độ trễ tính bằng mili-giây.

## 2. Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo chuẩn Cloud-Native Microservices, phân tách rõ ràng các tầng logic để đảm bảo hiệu suất:

* **API Gateway (Nginx):** Reverse Proxy định tuyến lưu lượng truy cập giữa Kiosk (Port 4000) và Admin Portal (Port 5000).
* **Frontend Layer (ReactJS + Vite + TailwindCSS):**
  * `frontend-admin`: Dashboard Quản trị viên phục vụ cấp vé trực tiếp qua Webcam, lưu trữ sinh trắc học, hiển thị biểu đồ Real-time và theo dõi nhật ký an ninh.
  * `frontend-kiosk`: Giao diện Kiosk Check-in tự động, tích hợp AI biên (Edge AI) để theo dõi trạng thái chớp mắt và phát hiện che khuất camera.
* **Backend Core API (FastAPI):** Tầng giao tiếp tốc độ cao xử lý logic nghiệp vụ và duy trì đường ống WebSockets.
* **AI Background Worker (RabbitMQ):** Tách biệt các tác vụ học máy nặng ra khỏi luồng chính. Đảm nhiệm trích xuất đặc trưng khuôn mặt và dọn dẹp bộ nhớ tạm.
* **Multi-tier Database:**
  * `PostgreSQL`: Lưu trữ dữ liệu quan hệ (Người dùng, Mã vé, Trạng thái, Log an ninh).
  * `Qdrant`: Vector Database chuyên dụng phục vụ so khớp độ tương đồng (Cosine Similarity).
  * `MinIO`: Object Storage lưu trữ hình ảnh vật lý làm bằng chứng an ninh.

## 3. Ứng dụng Trí tuệ Nhân tạo (AI Models)

Dự án sử dụng kiến trúc **Hybrid AI**, kết hợp nhiều mô hình từ siêu nhẹ đến chuyên sâu:

* **Client-side AI (face-api.js):** Chạy trực tiếp trên trình duyệt bằng WebGL/WASM. Sử dụng *TinyFaceDetector* để bắt nét Bounding Box và *FaceLandmark68TinyNet* để chấm 68 điểm neo trên mặt, phục vụ việc đo tỷ lệ mở mắt (EAR) thời gian thực.
* **Server-side AI (DeepFace):** * *RetinaFace:* Mạng nơ-ron định vị chính xác khuôn mặt trong điều kiện ánh sáng phức tạp (Face Detection).
  * *ArcFace:* Mô hình trích xuất đặc trưng (Embedding) biến khuôn mặt thành Vector 512 chiều để lưu trữ và so sánh.

## 4. Điểm nhấn Kỹ thuật (Technical Highlights)

* **Liveness Detection (Chống giả mạo 3D):** Thuật toán đo khoảng cách mí mắt trên/dưới. Kiosk yêu cầu khách hàng phải thực hiện hành động "Chớp mắt" (Blink) để vượt qua bài kiểm tra người thật, chặn đứng các hành vi giơ ảnh chụp từ điện thoại hay giấy in.
* **Eco Sleep Mode (Ngủ đông thông minh):** Trạm Kiosk tự động hạ độ sáng và ngắt vòng lặp quét AI nếu không phát hiện người sau 30 giây. Khi có người bước vào, hệ thống bừng tỉnh tức thì, giúp tiết kiệm tối đa CPU và điện năng cho thiết bị phần cứng.
* **Zero-Latency WebSockets & Hybrid Processing:** Trình duyệt tự gánh vác việc xử lý ảnh nhiễu, ảnh che khuất, nhiều mặt người. Nó chỉ gửi **duy nhất 1 tấm ảnh hoàn hảo nhất** lên Server qua WebSocket, giảm thiểu 90% gánh nặng băng thông cho máy chủ.
* **Admin Dashboard Real-time:** Màn hình quản trị tự động cập nhật số liệu sự kiện. Tích hợp AI gác cổng ngay tại form đăng ký: nếu Admin tải lên tấm ảnh không có khuôn mặt hợp lệ, hệ thống sẽ từ chối lưu ngay lập tức.

## 5. Hướng dẫn Cài đặt & Vận hành (Deployment)

Hệ thống được đóng gói hoàn toàn bằng Docker, giúp quá trình triển khai diễn ra đồng nhất.

**Bước 1: Khởi tạo biến môi trường**
```bash
cp .env.example .env
```

**Bước 2: Khởi chạy toàn bộ hệ thống bằng Docker Compose**
```bash
docker-compose up -d --build
```
*(Lưu ý: Trong lần chạy đầu tiên, hệ thống sẽ tự động tải các base image, biên dịch frontend và kéo Models AI. Có thể mất vài phút tùy thuộc vào tốc độ mạng).*

**Bước 3: Truy cập hệ thống**
* **Trạm kiểm soát (Check-in Kiosk):** http://localhost:4000
* **Trang Quản trị (Admin Portal):** http://localhost:5000 
  *(Tài khoản đăng nhập mặc định: `admin` / Mật khẩu: `admin`)*
* **Tài liệu API (Swagger UI):** http://localhost:8000/docs
* **Bảng điều khiển MinIO Storage:** http://localhost:9001
* **Bảng điều khiển RabbitMQ:** http://localhost:15672

## 6. Kịch bản Kiểm thử (Test Cases)

* **Kiểm thử AI Kiểm duyệt (Form Đăng ký):** Đăng nhập Admin, vào phần "Đăng ký Khách". Tải lên một bức ảnh phong cảnh hoặc ảnh có 2 người. **Kỳ vọng:** Hệ thống nháy đỏ, báo lỗi và khóa nút Lưu.
* **Kiểm thử Check-in Hợp lệ:** Đứng trước Camera Kiosk, nháy mắt 1 cái. **Kỳ vọng:** Kiosk đóng băng camera, báo Xanh lá "Thành công" và hiển thị thẻ VIP. Bảng Dashboard của Admin lập tức nảy số lượng Check-in.
* **Kiểm thử Liveness (Chống giả mạo):** Dùng điện thoại mở một bức ảnh chân dung và giơ trước Kiosk. **Kỳ vọng:** Kiosk bắt được mặt nhưng hiện cảnh báo xanh lơ "Vui lòng chớp mắt". Hệ thống kiên quyết không cấp quyền vào cổng.
* **Kiểm thử Ngủ đông & Bịt mắt:** Che tay vào webcam Kiosk. **Kỳ vọng:** Cảnh báo "Camera bị che khuất". Thả tay ra, bỏ trống khung hình 30 giây. **Kỳ vọng:** Màn hình Kiosk tự động chuyển sang chế độ "Đang nghỉ" tối màu.

## 7. Khắc phục sự cố (Troubleshooting)

* **Lỗi `502 Bad Gateway` khi truy cập Kiosk/Admin:** Do Nginx khởi động nhanh hơn Frontend đang trong quá trình build. Cách xử lý: Tải lại trang (F5) sau 1 phút hoặc chạy lệnh `docker-compose restart nginx`.
* **Hệ thống phản hồi chậm trong lần đầu mở máy:** Ứng dụng Backend cần khởi tạo (warm-up) mô hình ArcFace và RetinaFace vào bộ nhớ RAM trong yêu cầu xử lý đầu tiên. Các yêu cầu tiếp theo sẽ diễn ra tức thời.
* **Lỗi không mở được Camera:** Đảm bảo trình duyệt được cấp quyền truy cập thiết bị thu hình (Webcam) trên URL `localhost`. Nếu dùng mạng LAN (truy cập qua IP), phải đảm bảo giao thức HTTPS hoặc cấu hình ngoại lệ cho trình duyệt.

---
*Báo cáo được thực hiện nhằm phục vụ mục đích đánh giá học phần. Vui lòng không sử dụng cho mục đích thương mại khi chưa có sự đồng ý của tác giả.*
