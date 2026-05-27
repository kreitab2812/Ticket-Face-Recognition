# worker/Dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "numpy<2" "opencv-python<4.11" "tensorflow==2.16.1" "tf-keras==2.16.0"

COPY . .

# Chay task mac dinh
CMD ["python", "-m", "task_embedding"]
