#!/bin/bash
# Script de sao luu co so du lieu PostgreSQL tu trong Docker ra ngoai may host

# Tu dong nap bien moi truong tu file .env
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
    echo "[-] Khong tim thay file .env. Vui long chay script tu thu muc goc cua du an."
    exit 1
fi

BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
FILE_NAME="db_backup_${DATE}.sql"

echo "[*] Dang tao thu muc luu tru backup..."
mkdir -p $BACKUP_DIR

echo "[*] Dang thuc thi lenh pg_dump vao container postgres_db..."
# Truyen mat khau qua PGPASSWORD de khong bi hoi pass, tu dong an khop ten user/db tu .env
docker exec -e PGPASSWORD=${DB_PASSWORD} -i postgres_db pg_dump -U ${DB_USER} -d ${DB_NAME} -F p > "${BACKUP_DIR}/${FILE_NAME}"

echo "[+] Sao luu thanh cong! File duoc luu tai: ${BACKUP_DIR}/${FILE_NAME}"
