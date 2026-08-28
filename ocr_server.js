const express = require('express');
const Tesseract = require('tesseract.js');

const app = express();
const port = 8765;

// Middleware to parse raw binary body
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

app.post('/ocr', async (req, res) => {
  try {
    const lang = req.headers['x-ocr-lang'] || 'eng';
    const imageBuffer = req.body;

    if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
      return res.status(400).json({ error: 'No image data provided in raw body' });
    }

    console.log(`[OCR] Received image for language: ${lang}, size: ${imageBuffer.length} bytes`);
    
    // Convert 'ar' to 'ara' for Tesseract, fallback to 'eng'
    const tessLang = lang === 'ar' ? 'ara+eng' : 'eng';
    
    // We can optimize by keeping the worker alive, but for now we create and terminate
    const worker = await Tesseract.createWorker(tessLang);
    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();

    console.log(`[OCR] Recognized ${text.length} chars`);
    res.json({ text: text });
  } catch (err) {
    console.error('[OCR] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`OCR Node.js server listening at http://localhost:${port}`);
});
