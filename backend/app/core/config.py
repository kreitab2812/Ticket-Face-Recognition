import os

class Settings:
    PROJECT_NAME: str = "Event Check-in Enterprise API"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://admin:adminpassword@postgres:5432/event_checkin")
    
    # Qdrant Vector DB
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "qdrant")
    QDRANT_PORT: int = 6333
    
    # MinIO Storage
    MINIO_URL: str = os.getenv("MINIO_URL", "minio:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "admin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "adminpassword")
    BUCKET_NAME: str = "event-logs"
    
    # RabbitMQ
    MQ_USER: str = os.getenv("MQ_USER", "admin")
    MQ_PASSWORD: str = os.getenv("MQ_PASSWORD", "adminpassword")
    MQ_HOST: str = os.getenv("MQ_HOST", "rabbitmq")

settings = Settings()
