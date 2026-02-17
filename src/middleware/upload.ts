import multer from 'multer';
import type { Request } from 'express';

const ALLOWED_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const storage = multer.memoryStorage();

export const videoUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter(_req: Request, file, cb) {
    if (ALLOWED_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozvoljeni formati: MP4, WebM, MOV'));
    }
  },
}).single('video');
