import os
from flask import Flask, request, jsonify
import pytesseract
from PIL import Image
import io

app = Flask(__name__)

@app.route('/ocr', methods=['POST'])
def ocr():
    try:
        lang_header = request.headers.get('x-ocr-lang', 'eng')
        # Map frontend 'ar' to tesseract 'ara'
        tess_lang = 'ara+eng' if lang_header == 'ar' else 'eng'
        
        image_data = request.get_data()
        if not image_data:
            return jsonify({'error': 'No image data'}), 400
            
        image = Image.open(io.BytesIO(image_data))
        
        # Optimize image for OCR speed: convert to grayscale and resize
        image = image.convert('L')
        # Tesseract is extremely slow on high-res images, scale down if too large
        max_size = 1200
        if max(image.size) > max_size:
            ratio = max_size / max(image.size)
            new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            
        text = pytesseract.image_to_string(image, lang=tess_lang)
        
        return jsonify({'text': text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8765, debug=False)
