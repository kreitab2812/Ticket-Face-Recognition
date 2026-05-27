import pika
import json
import uuid
from deepface import DeepFace
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct

qdrant = QdrantClient(host="qdrant", port=6333)

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
    employee_name = data['name']

    print(f"[*] Đang xử lý khuôn mặt cho: {employee_name}")
    try:
        embedding_objs = DeepFace.represent(img_path=image_path, model_name="ArcFace", enforce_detection=False)
        embedding = embedding_objs[0]["embedding"]

        qdrant.upsert(
            collection_name="faces_arcface",
            points=[
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={"name": employee_name}
                )
            ]
        )
        print(f"[+] Thành công: Đã lưu {employee_name} vào Qdrant.")
    except Exception as e:
        print(f"[-] Lỗi khi xử lý {employee_name}: {e}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

credentials = pika.PlainCredentials('admin', 'adminpassword')
connection = pika.BlockingConnection(
    pika.ConnectionParameters(host='rabbitmq', credentials=credentials)
)
channel = connection.channel()
channel.queue_declare(queue='face_processing')

channel.basic_consume(queue='face_processing', on_message_callback=process_message)
print('[*] Worker đang chờ message từ RabbitMQ. Bấm CTRL+C để thoát.')
channel.start_consuming()
