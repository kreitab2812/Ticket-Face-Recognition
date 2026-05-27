# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Cai dat cac thu vien he thong loi cho OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy file requirements va cai dat thu vien
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "numpy<2" "opencv-python<4.11" "tensorflow==2.16.1" "tf-keras==2.16.0" "httpx<0.28.0"

# Copy toan bo code cua backend vao
COPY . .

# Mo port 8000
EXPOSE 8000

# Lenh khoi chay server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
