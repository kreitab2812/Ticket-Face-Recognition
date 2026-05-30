import pika
import time
import os
from tasks.task_embedding import process_message

MQ_USER = os.getenv("MQ_USER", "guest")
MQ_PASSWORD = os.getenv("MQ_PASSWORD", "guest")

# [FIX TẬN GỐC]: Tự động gọi biến môi trường, mặc định trỏ về tên service chuẩn "rabbitmq"
MQ_HOST = os.getenv("MQ_HOST", "rabbitmq") 

def main():
    while True:
        try:
            credentials = pika.PlainCredentials(MQ_USER, MQ_PASSWORD)
            connection = pika.BlockingConnection(
                pika.ConnectionParameters(host=MQ_HOST, credentials=credentials)
            )
            channel = connection.channel()

            channel.queue_declare(queue='ticket_processing')
            
            # Toi uu RAM: Chi cho phep worker nhan xu ly 1 anh moi lan
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue='ticket_processing', on_message_callback=process_message)

            print('[*] Trinh xu ly ngam (AI Worker) da san sang nhan tac vu...', flush=True)
            channel.start_consuming()
            
        except pika.exceptions.AMQPConnectionError:
            print(f"[-] Mat ket noi voi RabbitMQ ({MQ_HOST}). Dang thu lai sau 5 giay...", flush=True)
            time.sleep(5)
        except Exception as e:
            print(f"[-] Loi he thong mang: {e}", flush=True)
            time.sleep(5)

if __name__ == '__main__':
    main()
