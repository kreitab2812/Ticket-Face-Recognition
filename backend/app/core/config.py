from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Event Check-in Enterprise API"
    
    # Cau hinh Database
    DATABASE_URL: str = "postgresql://admin:adminpassword@postgres:5432/event_checkin"
    
    # Cau hinh Qdrant
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    
    # Cau hinh MinIO
    MINIO_URL: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "admin"
    MINIO_SECRET_KEY: str = "adminpassword"
    BUCKET_NAME: str = "event-logs"
    
    # Cau hinh RabbitMQ
    MQ_USER: str = "admin"
    MQ_PASSWORD: str = "adminpassword"
    MQ_HOST: str = "rabbitmq"

    # Tu dong doc tu file .env neu bien nao bi thieu
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
