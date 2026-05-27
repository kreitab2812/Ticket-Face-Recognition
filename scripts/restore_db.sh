#!/bin/bash
# Script de phuc hoi co so du lieu PostgreSQL tu file backup

if [ -z "$1" ]; then
  echo "[-] Loi: Chua truyen file backup!"
  echo "[-] Cach dung: ./scripts/restore_db.sh ./backups/db_backup_20260528_120000.sql"
  exit 1
fi

FILE_PATH=$1

if [ ! -f "$FILE_PATH" ]; then
    echo "[-] Loi: File '$FILE_PATH' khong ton tai."
    exit 1
fi

# Tu dong nap bien moi truong tu file .env
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
else
    echo "[-] Khong tim thay file .env. Vui long chay script tu thu muc goc cua du an."
    exit 1
fi

echo "[*] Dang phuc hoi co so du lieu tu file $FILE_PATH..."
# Dung cat de day noi dung file vao psql qua duong ong
cat "$FILE_PATH" | docker exec -e PGPASSWORD=${DB_PASSWORD} -i postgres_db psql -U ${DB_USER} -d ${DB_NAME}

echo "[+] Phuc hoi thanh cong!"
