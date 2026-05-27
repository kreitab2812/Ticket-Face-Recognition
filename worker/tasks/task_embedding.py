import pika
import json
import uuid
import os
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

from app.core.config import settings

qdrant = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

# Khoi tao collection neu chua co
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

    print(f"[*] Bat dau trich xuat dac trung sinh trac hoc cho ve: {ticket_code}")
    try:
        # Su dung RetinaFace de cat mat va ArcFace de lay vector 512 chieu
        embedding_objs = DeepFace.represent(
            img_path=image_path, 
            model_name="ArcFace", 
            detector_backend="retinaface",
            enforce_detection=True
        )
        embedding = embedding_objs[0]["embedding"]

        # Luu vector vao Qdrant kem theo payload la thong tin khach hang
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
        print(f"[+] Hoan tat luu tru vector cho khach hang: {attendee_name}.")
        
        # Xoa tep tam de toi uu khong gian luu tru sau khi nhan dien xong
        if os.path.exists(image_path):
            os.remove(image_path)
            
    except Exception as e:
        print(f"[-] Loi phan tich hinh anh doi voi ve {ticket_code}: {e}")

    # Xac nhan voi RabbitMQ la da xu ly xong message
    ch.basic_ack(delivery_tag=method.delivery_tag)

# Thiet lap ket noi RabbitMQ
credentials = pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD)
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host=settings.MQ_HOST, credentials=credentials)
)
channel = connection.channel()

channel.queue_declare(queue='ticket_processing')
channel.basic_consume(queue='ticket_processing', on_message_callback=process_message)

print('[*] Trinh xu ly ngam (Worker) dang cho nhan tin hieu tu RabbitMQ...')
channel.start_consuming()
