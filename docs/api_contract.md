# Tài Liệu Đặc Tả API (API Contract)

Tài liệu này mô tả cách giao tiếp giữa Frontend và Backend.

## 1. WebSocket: Luồng Check-in Kiosk
* **Endpoint:** `ws://<host>:4000/api/ws/scan`
* **Mô tả:** Mở đường ống kết nối thời gian thực, nhận ảnh thô từ camera, trả về kết quả AI.
* **Định dạng gửi (Client -> Server):** Chuỗi Base64 của ảnh JPEG.
* **Định dạng nhận (Server -> Client):**
```json
{
  "status": "success | error | idle",
  "access": "granted | denied",
  "message": "Thông báo chi tiết"
}
