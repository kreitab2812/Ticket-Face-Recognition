#!/bin/bash
# Script de phuc hoi co so du lieu PostgreSQL tu file backup

if [ -z "$1" ]; then
  echo "[-] Loi: Chua truyen file backup!"
  echo "[-] Cach dung: ./restore_db.sh ./backups/db_backup_20260528_120000.sql"
  exit 1
fi

FILE_PATH=$1

if [ ! -f "$FILE_PATH" ]; then
    echo "[-] Loi: File '$FILE_PATH' khong ton tai."
    exit 1
fi

echo "[*] Dang phuc hoi co so du lieu tu file $FILE_PATH..."
cat "$FILE_PATH" | docker exec -i postgres_db psql -U admin -d event_checkin

echo "[+] Phuc hoi thanh cong!"
