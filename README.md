# BTL: Hệ thống Check-in Sự kiện và Chống Vé Chợ Đen dựa trên Nhận diện Khuôn mặt

![Python](https://img.shields.io/badge/Major-Artificial_Intelligence)
![Course](https://img.shields.io/badge/Course-AI_System_Development_Practice-green)
![School](https://img.shields.io/badge/School-UET_VNU-blue)

**Môn học:** Thực hành phát triển hệ thống trí tuệ nhân tạo - AIT3004_4  
**Học kỳ:** 2, 2025–2026  
**Trường:** Đại học Công nghệ, ĐHQG Hà Nội (UET-VNU)  

---

## Thông tin Giảng viên và Sinh viên

**Giảng viên hướng dẫn:**
- ThS. Nguyễn Hải Toàn 
- CN. Hoàng Phi Hùng
- CN. Long Trí Thái Sơn

**Sinh viên thực hiện:**
- Tên sinh viên: Đinh Mạnh Cường
- Mã sinh viên: 24022274
- Vai trò: Phát triển Full-stack, Cấu hình luồng xử lý AI và Triển khai hạ tầng (System Architecture & DevOps)

---

## Mục lục
1. [Tóm tắt dự án (Abstract)](#1-tóm-tắt-dự-án-abstract)
2. [Kiến trúc Hệ thống (System Architecture)](#2-kiến-trúc-hệ-thống-system-architecture)
3. [Ứng dụng Trí tuệ Nhân tạo (AI Models)](#3-ứng-dụng-trí-tuệ-nhân-tạo-ai-models)
4. [Điểm nhấn Kỹ thuật (Technical Highlights)](#4-điểm-nhấn-kỹ-thuật-technical-highlights)
5. [Hướng dẫn Cài đặt & Vận hành (Deployment)](#5-hướng-dẫn-cài-đặt--vận-hành-deployment)
6. [Kịch bản Kiểm thử (Test Cases)](#6-kịch-bản-kiểm-thử-test-cases)
7. [Khắc phục sự cố (Troubleshooting)](#7-khắc-phục-sự-cố-troubleshooting)

---

## 1. Tóm tắt dự án (Abstract)

Việc sử dụng vé giấy hoặc mã QR trong các sự kiện quy mô lớn thường tồn tại lỗ hổng an ninh nghiêm trọng, tiêu biểu là vấn nạn vé chợ đen và quay vòng vé (Ticket Looping). 

Dự án này đề xuất và xây dựng một hệ thống kiểm soát cửa ra vào (Check-in Kiosk) tự động. Cốt lõi của giải pháp là việc định danh sinh trắc học trực tiếp một mã vé với duy nhất một khuôn mặt. Bằng việc áp dụng kiến trúc Microservices, cơ sở dữ liệu Vector (Qdrant) và giao thức Real-time WebSockets, hệ thống cho phép quét khuôn mặt và phát hiện gian lận trong thời gian thực với độ trễ tối thiểu, đảm bảo khả năng mở rộng (Scalability) và tính sẵn sàng cao (High Availability).

## 2. Kiến trúc Hệ thống (System Architecture)

Hệ thống được thiết kế theo chuẩn Cloud-Native Microservices, phân tách rõ ràng các tầng logic để đảm bảo hiệu suất và dễ dàng bảo trì:

* **API Gateway (Nginx):** Đóng vai trò Reverse Proxy, định tuyến lưu lượng truy cập độc lập giữa Kiosk (Port 4000) và Admin Portal (Port 5000).
* **Frontend Layer (ReactJS + Vite):**
  * `frontend-admin`: Giao diện Quản trị viên phục vụ cấp vé, lưu trữ sinh trắc học và theo dõi log thời gian thực.
  * `frontend-kiosk`: Giao diện trạm kiểm soát tự động, kết nối trực tiếp với luồng Camera của người dùng.
* **Backend Core API (FastAPI):** Tầng giao tiếp tốc độ cao xử lý logic nghiệp vụ. Hệ thống sử dụng kiến trúc bất đồng bộ (Asynchronous) và duy trì đường ống WebSockets.
* **AI Background Worker (RabbitMQ):** Tách biệt các tác vụ học máy nặng (Machine Learning) ra khỏi luồng chính. Bộ phận này đảm nhiệm việc trích xuất đặc trưng khuôn mặt (Feature Extraction) và dọn dẹp bộ nhớ tạm tự động.
* **Multi-tier Database:**
  * `PostgreSQL`: Lưu trữ dữ liệu quan hệ (Thông tin người dùng, Mã vé, Trạng thái Check-in).
  * `Qdrant`: Vector Database chuyên dụng phục vụ so khớp độ tương đồng (Cosine Similarity) cho các vector khuôn mặt 512 chiều.
  * `MinIO`: Object Storage lưu trữ hình ảnh vật lý làm bằng chứng an ninh.

## 3. Ứng dụng Trí tuệ Nhân tạo (AI Models)

Hệ thống tích hợp các mô hình học sâu từ thư viện DeepFace để xử lý thị giác máy tính:

* **RetinaFace (Face Detection):** Mạng nơ-ron định vị chính xác tọa độ khuôn mặt trong điều kiện ánh sáng phức tạp, cho khả năng chống nhiễu tốt.
* **ArcFace (Face Recognition):** Mô hình trích xuất đặc trưng (Embedding). Hệ thống biến đổi ma trận điểm ảnh thành một Vector 512 chiều. Mọi phép nhận diện khuôn mặt thực chất là việc tính toán khoảng cách giữa 2 vector trong không gian đa chiều tại Qdrant DB.

## 4. Điểm nhấn Kỹ thuật (Technical Highlights)

* **Zero-Latency WebSockets:** Thay vì sử dụng kỹ thuật truyền thống như Polling gây nghẽn mạng, Kiosk truyền trực tiếp luồng ảnh Base64 vào WebSocket. Việc này giúp Backend xử lý và phản hồi kết quả truy cập ngay tức thì.
* **Asynchronous Message Broker:** Luồng đăng ký vé yêu cầu xử lý AI được đẩy vào hàng đợi RabbitMQ để Worker xử lý ngầm, đảm bảo luồng chính của API không bị treo khi có lượng lớn người dùng cùng lúc.
* **Scaffolding Enterprise:** Mã nguồn được tổ chức theo chuẩn thiết kế doanh nghiệp, phân tách rõ ràng các thư mục `routers`, `services`, `models`, `schemas`, tạo tiền đề tốt cho việc mở rộng và bảo trì sau này.

## 5. Hướng dẫn Cài đặt & Vận hành (Deployment)

Hệ thống được đóng gói hoàn toàn bằng Docker, giúp quá trình triển khai diễn ra đồng nhất và không bị phụ thuộc vào môi trường máy host.

**Bước 1: Khởi tạo biến môi trường**
```bash
cp .env.example .env
```
**Bước 2: Khởi chạy toàn bộ hệ thống bằng Docker Compose**

```bash
docker-compose up -d --build
```

> **Lưu ý:** Trong lần chạy đầu tiên, hệ thống sẽ tự động tải các base image, biên dịch frontend và tải Weights của mô hình AI. Quá trình này có thể mất vài phút tùy thuộc vào tốc độ mạng.

**Bước 3: Truy cập hệ thống**

* **Màn hình Trạm kiểm soát (Check-in Kiosk):** [http://localhost:4000](http://localhost:4000)
* **Màn hình Quản trị (Admin Portal):** [http://localhost:5000](http://localhost:5000)
* **Tài liệu API (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
* **Bảng điều khiển MinIO Storage:** [http://localhost:9001](http://localhost:9001)
* **Bảng điều khiển RabbitMQ:** [http://localhost:15672](http://localhost:15672)

## 6. Kịch bản Kiểm thử (Test Cases)

* **Đăng ký định danh:** Truy cập Admin Portal, nhập thông tin Tên, Mã vé (VD: `UET-01`) và tải lên ảnh chân dung. Hệ thống thông báo lưu trữ thành công.
* **Check-in Hợp lệ:** Đứng trước Camera của trang Kiosk. Hệ thống nhận diện khuôn mặt, nháy viền xanh, hiển thị thông báo "Hợp lệ" và mở cổng. Trạng thái mã vé `UET-01` trong cơ sở dữ liệu được cập nhật thành đã sử dụng.
* **Cảnh báo Vé chợ đen:** Nếu khuôn mặt đó tiếp tục quét tại Kiosk, hệ thống sẽ đối chiếu cơ sở dữ liệu, phát hiện vé đã được kích hoạt trước đó. Giao diện lập tức nháy viền đỏ và hiển thị cảnh báo từ chối truy cập.

## 7. Khắc phục sự cố (Troubleshooting)

* **Lỗi không nhận diện được camera:** Đảm bảo trình duyệt được cấp quyền truy cập thiết bị thu hình (webcam/camera) khi truy cập `http://localhost:4000`.
* **Hệ thống phản hồi chậm trong lần đầu truy cập:** Do ứng dụng Backend cần khởi tạo (warm-up) mô hình AI ArcFace và RetinaFace vào bộ nhớ đệm trong yêu cầu xử lý đầu tiên. Các yêu cầu tiếp theo sẽ diễn ra tức thời.
* **Xung đột cổng (Port conflict):** Kiểm tra và dừng các tiến trình đang sử dụng các cổng `4000`, `5000`, `8000`, `5432`, `6333`, `9000`, `9001`, `5672` trên máy host trước khi khởi chạy Docker.

---
*Báo cáo được thực hiện nhằm phục vụ mục đích đánh giá học phần. Vui lòng không sử dụng cho mục đích thương mại khi chưa có sự đồng ý của tác giả.*
