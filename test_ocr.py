from PIL import Image
import requests
import io
import time

img = Image.new('RGB', (2000, 2000), color = 'white')
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='PNG')
img_byte_arr = img_byte_arr.getvalue()

start = time.time()
try:
    res = requests.post('http://localhost:8765/ocr', data=img_byte_arr, headers={'x-ocr-lang': 'eng'})
    print(f"Status: {res.status_code}, Time: {time.time() - start:.2f}s")
    print("Response:", res.text)
except Exception as e:
    print("Error:", e)
