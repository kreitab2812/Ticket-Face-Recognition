import requests
import os

# Script de tu dong tao du lieu test cho he thong
API_URL = "http://localhost:5000/api/admin/add_attendee"

# Chuan bi san mot buc anh test.jpg o cung thu muc script nay
test_image_path = "test.jpg"

mock_users = [
    {"name": "Nguyen Van A", "ticket_code": "TICKET001"},
    {"name": "Tran Thi B", "ticket_code": "TICKET002"},
    {"name": "Le Hoang C", "ticket_code": "TICKET003"}
]

print("[*] Bat dau tao du lieu gia vao he thong...")

if not os.path.exists(test_image_path):
    print("[-] Vui long de 1 file 'test.jpg' o thu muc scripts de chay!")
else:
    for user in mock_users:
        with open(test_image_path, "rb") as img:
            files = {"file": (test_image_path, img, "image/jpeg")}
            data = {"name": user["name"], "ticket_code": user["ticket_code"]}
            
            response = requests.post(API_URL, data=data, files=files)
            print(f"-> ThemMoi {user['ticket_code']}: {response.json()}")
            
print("[+] Hoan tat bom du lieu!")
