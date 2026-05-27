import cv2
from deepface import DeepFace

cap = cv2.VideoCapture(0)
print("[*] Đang khởi động Camera... Nhấn phím 'q' để thoát.")

frame_skip = 10  # Cứ 10 frame mới gọi AI 1 lần
frame_count = 0
last_faces = []  # Bộ nhớ tạm lưu tọa độ mặt

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_count += 1

    # Chỉ chạy AI siêu nặng mỗi 10 frame
    if frame_count % frame_skip == 0:
        try:
            faces = DeepFace.extract_faces(
                img_path=frame, 
                detector_backend="retinaface",
                enforce_detection=False
            )
            last_faces = faces # Cập nhật tọa độ mới
        except Exception:
            last_faces = []

    # Vẽ khung chữ nhật dựa trên bộ nhớ tạm (Siêu mượt)
    for face in last_faces:
        if 'facial_area' in face:
            area = face['facial_area']
            x, y, w, h = area['x'], area['y'], area['w'], area['h']
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(frame, "RetinaFace", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Lật khung hình như gương soi
    frame = cv2.flip(frame, 1)
    
    cv2.imshow("Test AI - RetinaFace (60FPS Mode)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
