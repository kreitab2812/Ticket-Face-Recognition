#!/bin/bash
# Script de sao luu co so du lieu PostgreSQL tu trong Docker ra ngoai may host

BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
FILE_NAME="db_backup_${DATE}.sql"

echo "[*] Dang tao thu muc luu tru backup..."
mkdir -p $BACKUP_DIR

echo "[*] Dang thuc thi lenh pg_dump vao container postgres_db..."
# Su dung mat khau va user nhu trong file docker-compose
docker exec -t postgres_db pg_dump -U admin -d event_checkin -F c > "${BACKUP_DIR}/${FILE_NAME}"

echo "[+] Sao luu thanh cong! File duoc luu tai: ${BACKUP_DIR}/${FILE_NAME}"
