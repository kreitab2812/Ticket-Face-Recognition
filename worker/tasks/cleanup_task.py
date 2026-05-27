import os
import time
import glob
from datetime import datetime, timedelta

# Fix: Su dung duong dan tuong doi hoac lay tu bien moi truong, khong hardcode "/code"
TEMP_DIR = os.getenv("TEMP_IMAGES_DIR", "temp_images")

# Dam bao thu muc ton tai truoc khi giam sat de tranh bi loi
os.makedirs(TEMP_DIR, exist_ok=True)

# Chi xoa nhung file rac da ton tai qua 1 gio
AGE_LIMIT = timedelta(hours=1)

print(f"[*] Cleanup Worker da khoi dong. Dang giam sat thu muc: {TEMP_DIR}")

while True:
    try:
        now = datetime.now()
        files = glob.glob(os.path.join(TEMP_DIR, "*"))
        deleted_count = 0
        
        for f in files:
            if os.path.isfile(f):
                # Lay thoi gian tao cua file
                file_time = datetime.fromtimestamp(os.path.getmtime(f))
                if now - file_time > AGE_LIMIT:
                    os.remove(f)
                    deleted_count += 1
                    
        if deleted_count > 0:
            print(f"[{now.strftime('%Y-%m-%d %H:%M:%S')}] Da don dep thanh cong {deleted_count} buc anh rac.")
            
    except Exception as e:
        print(f"[-] Loi trong qua trinh don dep: {e}")
    
    # Cho Worker ngu 1 gio (3600 giay) roi moi thuc day quet tiep
    time.sleep(3600)
