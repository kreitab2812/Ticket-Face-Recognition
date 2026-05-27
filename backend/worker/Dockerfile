# Su dung anh Python mong nhe de tiet kiem dung luong
FROM python:3.10-slim

WORKDIR /code

# Cai dat cac thu vien he thong can thiet cho viec xu ly anh cua OpenCV
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Cai dat thu vien Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toan bo ma nguon cua Worker vao container
COPY . .

# Lenh chay mac dinh (Co the bi ghi de boi docker-compose.yml)
CMD ["python", "-m", "worker.tasks.task_embedding"]
