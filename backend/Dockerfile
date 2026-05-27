FROM python:3.10-slim

# Thiết lập thư mục làm việc mặc định bên trong Container
WORKDIR /code

# Cài đặt các thư viện hệ thống lõi cho thuật toán Computer Vision (OpenCV, DeepFace)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt thư viện Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Sao chép toàn bộ mã nguồn (thư mục app và worker) vào /code
COPY . .

# Khai báo đường dẫn để Python nhận diện được các module nội bộ
ENV PYTHONPATH=/code
