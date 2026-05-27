import pika
import json
import uuid
import os
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

# lay tu bien moi truong hoac dung default cua docker
QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")

qdrant = QdrantClient(host=QDRANT_HOST, port=6333)

# setup collection neu chua co
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
    ticket_code = data['ticket_code'] # qtrong: dung ticket_code lam payload

    print(f"[*] Dang xu ly khuon mat cho ve: {ticket_code} - {attendee_name}")
    try:
        # dung retinaface giong ben main de extract chinh xac nhat
        embedding_objs = DeepFace.represent(
            img_path=image_path, 
            model_name="ArcFace", 
            detector_backend="retinaface",
            enforce_detection=True
        )
        embedding = embedding_objs[0]["embedding"]

        # day vao db vector
        qdrant.upsert(
            collection_name="faces_arcface",
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "name": attendee_name,
                        "ticket_code": ticket_code # xai cai nay luc query
                    }
                )
            ]
        )
        print(f"[+] Xong: Da luu khach {attendee_name} vao Qdrant.")
        
        # xoa file rac khi chay xong do nang may
        if os.path.exists(image_path):
            os.remove(image_path)
            
    except Exception as e:
        print(f"[-] Loi luc xy ly ve {ticket_code}: {e}")

    # xac nhan voi rabbitmq la task done
    ch.basic_ack(delivery_tag=method.delivery_tag)

# connect rabbitmq
credentials = pika.PlainCredentials('admin', 'adminpassword')
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
)
channel = connection.channel()

# doi ten queue theo concept moi
channel.queue_declare(queue='ticket_processing')

channel.basic_consume(queue='ticket_processing', on_message_callback=process_message)
print('[*] Worker dang cho message luoi anh tu RabbitMQ...')
channel.start_consuming()
