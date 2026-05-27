import cv2
from deepface import DeepFace

cap = cv2.VideoCapture(0)
print("[*] Dang khoi dong Camera... Nhan phim 'q' de thoat.")

frame_skip = 10  # Cu 10 frame moi goi AI 1 lan de giam tai CPU
frame_count = 0
last_faces = []  # Bo nho tam luu toa do khuon mat

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # FIX BUG: Phai lat khung hinh (mirror) NGAY TU DAU. 
    # Neu lat sau khi ve, khung chu nhat se bi nguoc so voi khuon mat.
    frame = cv2.flip(frame, 1)
    
    frame_count += 1

    # Chi chay AI sieu nang moi 10 frame (Xy ly da luong co the muot hon nua)
    if frame_count % frame_skip == 0:
        try:
            faces = DeepFace.extract_faces(
                img_path=frame, 
                detector_backend="retinaface",
                enforce_detection=False
            )
            last_faces = faces # Cap nhat toa do moi
        except Exception:
            last_faces = []

    # Ve khung chu nhat dua tren bo nho tam (Giu cho FPS luon cao)
    for face in last_faces:
        if 'facial_area' in face:
            area = face['facial_area']
            x, y, w, h = area['x'], area['y'], area['w'], area['h']
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.putText(frame, "RetinaFace", (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    cv2.imshow("Test AI - RetinaFace (60FPS Mode)", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
