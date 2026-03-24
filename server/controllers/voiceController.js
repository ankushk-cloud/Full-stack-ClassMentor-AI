import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transcribeAudio } from '../services/aiService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const transcribe = async (req, res) => {
  if (!req.file || !req.file.buffer) {
    return res.status(400).json({
      message: 'No audio received. Record for 1–2 seconds, then stop the mic.',
    });
  }

  const ext = req.file.mimetype === 'audio/webm' ? '.webm' : req.file.originalname?.match(/\.[a-z0-9]+$/i)?.[0] || '.webm';
  const tmpPath = path.join(__dirname, '..', 'tmp', `audio-${Date.now()}${ext}`);

  try {
    const tmpDir = path.dirname(tmpPath);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(tmpPath, req.file.buffer);
    const text = await transcribeAudio(tmpPath);
    res.json({ text });
  } catch (error) {
    const status = error.message.includes('API key') ? 503 : error.message.includes('quota') ? 429 : 500;
    res.status(status).json({ message: error.message || 'Transcription failed' });
  } finally {
    try {
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch (_) {}
  }
};
