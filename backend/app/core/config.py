from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Event Check-in Enterprise API"
    
    # Cau hinh Database (Bo hardcode mat khau, bat buoc phai co trong .env)
    DATABASE_URL: str
    
    # Cau hinh Qdrant
    QDRANT_HOST: str = "qdrant"
    QDRANT_PORT: int = 6333
    
    # Cau hinh MinIO
    MINIO_URL: str
    MINIO_ACCESS_KEY: str
    MINIO_SECRET_KEY: str
    BUCKET_NAME: str = "event-logs"
    # Them URL public de Client co the truy cap anh (thay vi hardcode localhost)
    MINIO_PUBLIC_URL: str = "http://localhost:9000"
    
    # Cau hinh RabbitMQ
    MQ_USER: str
    MQ_PASSWORD: str
    MQ_HOST: str = "rabbitmq"

    # Tu dong doc tu file .env neu bien nao bi thieu, bo qua cac bien thua
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
