import requests
import os
import random
import string

# URL API (Dieu chinh lai port 5000 hoac 8000 tuy vao cau hinh Nginx cua cau)
API_URL = "http://localhost:8000/admin/add_attendee"

# Chuan bi san mot buc anh test.jpg o cung thu muc script nay
test_image_path = "test.jpg"

def generate_random_string(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def bulk_insert(num_records=50):
    print(f"[*] Bat dau tao {num_records} du lieu gia vao he thong...")

    if not os.path.exists(test_image_path):
        print(f"[-] Vui long de 1 file '{test_image_path}' o thu muc scripts de chay!")
        return

    # Nap anh vao bo nho mot lan de dung cho tat ca cac request (tang toc do doc file)
    with open(test_image_path, "rb") as f:
        image_data = f.read()

    for i in range(num_records):
        ticket_code = f"TEST_{generate_random_string()}"
        name = f"Khach Hang Test {i+1}"
        
        # Requests bat buoc phai cung cap lai object file moi cho moi request
        files = {"file": (test_image_path, image_data, "image/jpeg")}
        data = {"name": name, "ticket_code": ticket_code}
        
        try:
            response = requests.post(API_URL, data=data, files=files)
            print(f"[{i+1}/{num_records}] -> ThemMoi {ticket_code}: Status {response.status_code}")
        except Exception as e:
            print(f"[-] Loi khi goi API cho {ticket_code}: {e}")

    print("[+] Hoan tat bom du lieu!")

if __name__ == "__main__":
    # Thay doi so luong nguoi muon test tai day
    bulk_insert(15)
