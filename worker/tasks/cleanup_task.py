import os
import time
import glob
from datetime import datetime, timedelta

# [FIX]: Trỏ đích danh vào thư mục chia sẻ Volume của Docker, không dùng đường dẫn tương đối nữa
TEMP_DIR = os.getenv("TEMP_IMAGES_DIR", "/code/temp_images")

os.makedirs(TEMP_DIR, exist_ok=True)

AGE_LIMIT = timedelta(hours=1)

print(f"[*] Cleanup Worker da khoi dong. Dang giam sat thu muc: {TEMP_DIR}", flush=True)

while True:
    try:
        now = datetime.now()
        files = glob.glob(os.path.join(TEMP_DIR, "*"))
        deleted_count = 0
        
        for f in files:
            if os.path.isfile(f):
                file_time = datetime.fromtimestamp(os.path.getmtime(f))
                if now - file_time > AGE_LIMIT:
                    os.remove(f)
                    deleted_count += 1
                    
        if deleted_count > 0:
            print(f"[{now.strftime('%Y-%m-%d %H:%M:%S')}] Da don dep thanh cong {deleted_count} buc anh rac.", flush=True)
            
    except Exception as e:
        print(f"[-] Loi trong qua trinh don dep: {e}", flush=True)
    
    time.sleep(3600)
