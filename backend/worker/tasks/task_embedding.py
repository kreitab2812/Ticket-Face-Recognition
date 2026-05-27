import pika
import json
import uuid
import os
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

from app.core.config import settings

qdrant = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

try:
    qdrant.get_collection("faces_arcface")
except:
    qdrant.create_collection(
        collection_name="faces_arcface",
        vectors_config=VectorParams(size=512, distance=Distance.COSINE) 
    )

def process_message(ch, method, properties, body):
    data = json.loads(body)
    image_path = data['image_path']
    attendee_name = data['name']
    ticket_code = data['ticket_code']

    print(f"[*] Bắt đầu trích xuất đặc trưng sinh trắc học cho vé: {ticket_code}")
    try:
        embedding_objs = DeepFace.represent(
            img_path=image_path, 
            model_name="ArcFace", 
            detector_backend="retinaface",
            enforce_detection=True
        )
        embedding = embedding_objs[0]["embedding"]

        qdrant.upsert(
            collection_name="faces_arcface",
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "name": attendee_name,
                        "ticket_code": ticket_code 
                    }
                )
            ]
        )
        print(f"[+] Hoàn tất lưu trữ vector cho khách hàng: {attendee_name}.")
        
        # Xóa tệp tạm để tối ưu không gian lưu trữ
        if os.path.exists(image_path):
            os.remove(image_path)
            
    except Exception as e:
        print(f"[-] Lỗi phân tích hình ảnh đối với vé {ticket_code}: {e}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

credentials = pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD)
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host=settings.MQ_HOST, credentials=credentials)
)
channel = connection.channel()

channel.queue_declare(queue='ticket_processing')
channel.basic_consume(queue='ticket_processing', on_message_callback=process_message)

print('[*] Trình xử lý ngầm (Worker) đang chờ nhận tín hiệu từ RabbitMQ...')
channel.start_consuming()
