import pika
import json
import uuid
import os
import time
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

from app.core.config import settings

qdrant = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)

# FIX BUG NGHIEM TRONG: Doi ten collection thanh "attendees" de khop voi router_kiosk.py
COLLECTION_NAME = "attendees"

# Khoi tao collection neu chua co
try:
    qdrant.get_collection(COLLECTION_NAME)
except:
    qdrant.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(size=512, distance=Distance.COSINE) 
    )

def process_message(ch, method, properties, body):
    data = json.loads(body)
    image_path = data.get('image_path')
    attendee_name = data.get('name')
    ticket_code = data.get('ticket_code')

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
            collection_name=COLLECTION_NAME,
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
        
        # Chi ACK (xac nhan thanh cong) khi moi viec troi chay hoan hao
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except ValueError:
        # Loi Deepface khong tim thay khuon mat -> Loi tu phia du lieu dau vao (anh loi)
        # Tinh huong nay co retries cung khong duoc, nen ACK de xoa khoi queue luon
        print(f"[-] Canh bao: Khong tim thay khuon mat trong ho so ve {ticket_code}.")
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        # Loi he thong (Qdrant sap, MinIO loi...) -> NACK de RabbitMQ dua lai vao queue doi xu ly sau
        print(f"[-] Loi he thong khi xu ly ve {ticket_code}: {e}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
    finally:
        # Biet doi don dep: Luon luon xoa file temp du cho code chay dung hay bao loi
        if image_path and os.path.exists(image_path):
            os.remove(image_path)

def main():
    # Co che Auto-Reconnect: Lap lai viec ket noi neu RabbitMQ chua san sang
    while True:
        try:
            credentials = pika.PlainCredentials(settings.MQ_USER, settings.MQ_PASSWORD)
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=settings.MQ_HOST, credentials=credentials)
            )
            channel = connection.channel()

            channel.queue_declare(queue='ticket_processing')
            
            # Toi uu RAM: Chi cho phep worker nhan xu ly 1 anh moi lan, xong moi nhan tiep
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue='ticket_processing', on_message_callback=process_message)

            print('[*] Trinh xu ly ngam (AI Worker) da san sang nhan tac vu...')
            channel.start_consuming()
            
        except pika.exceptions.AMQPConnectionError:
            print("[-] Mat ket noi voi RabbitMQ. Dang thu lai sau 5 giay...")
            time.sleep(5)

if __name__ == "__main__":
    main()
