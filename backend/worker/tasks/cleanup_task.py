import os
import time
import glob
from datetime import datetime, timedelta

TEMP_DIR = "/code/temp_images"
# Chỉ xóa những file rác đã tồn tại quá 1 giờ
AGE_LIMIT = timedelta(hours=1)

print("[*] Cleanup Worker đã khởi động. Đang giám sát thư mục tạm...")

while True:
    try:
        now = datetime.now()
        files = glob.glob(os.path.join(TEMP_DIR, "*"))
        deleted_count = 0
        
        for f in files:
            if os.path.isfile(f):
                # Lấy thời gian tạo của file
                file_time = datetime.fromtimestamp(os.path.getmtime(f))
                if now - file_time > AGE_LIMIT:
                    os.remove(f)
                    deleted_count += 1
                    
        if deleted_count > 0:
            print(f"[{now.strftime('%Y-%m-%d %H:%M:%S')}] Đã dọn dẹp thành công {deleted_count} bức ảnh rác.")
            
    except Exception as e:
        print(f"[-] Lỗi trong quá trình dọn dẹp: {e}")
    
    # Cho Worker ngủ 1 giờ (3600 giây) rồi mới thức dậy quét tiếp
    time.sleep(3600)
