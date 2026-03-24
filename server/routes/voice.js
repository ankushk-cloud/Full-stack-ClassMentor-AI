import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { transcribe } from '../controllers/voiceController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /^audio\/(webm|mp3|mpeg|mp4|m4a|ogg|wav|flac)$/;
    if (allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error('Invalid audio type. Use webm, mp3, wav, etc.'));
  },
});

router.use(protect);
router.post(
  '/transcribe',
  (req, res, next) => {
    upload.single('audio')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Invalid audio upload' });
      }
      next();
    });
  },
  transcribe
);

export default router;
