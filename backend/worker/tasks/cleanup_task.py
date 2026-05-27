import os
import time
import glob
from datetime import datetime, timedelta

TEMP_DIR = "/code/temp_images"
# Chi xoa nhung file rac da ton tai qua 1 gio
AGE_LIMIT = timedelta(hours=1)

print("[*] Cleanup Worker da khoi dong. Dang giam sat thu muc tam...")

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
