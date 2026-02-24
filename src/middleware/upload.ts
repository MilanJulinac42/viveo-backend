import multer from 'multer';
import type { Request } from 'express';

const storage = multer.memoryStorage();

// Video upload (existing)
const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/quicktime'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

export const videoUpload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter(_req: Request, file, cb) {
    if (VIDEO_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozvoljeni formati: MP4, WebM, MOV'));
    }
  },
}).single('video');

// Image upload (for product images)
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

export const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter(_req: Request, file, cb) {
    if (IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozvoljeni formati: JPEG, PNG, WebP'));
    }
  },
}).array('images', 5);

// Digital file upload (PDFs, ZIPs, audio, presets, etc.) — up to 500 MB
const MAX_DIGITAL_SIZE = 500 * 1024 * 1024; // 500 MB

export const digitalFileUpload = multer({
  storage,
  limits: { fileSize: MAX_DIGITAL_SIZE },
  fileFilter(_req: Request, _file, cb) {
    // Accept all file types for digital products
    cb(null, true);
  },
}).single('file');

// Digital preview image upload — same limits as product images
export const digitalPreviewUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter(_req: Request, file, cb) {
    if (IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozvoljeni formati za sliku: JPEG, PNG, WebP'));
    }
  },
}).single('preview');

// Avatar upload (single image, 5 MB, JPEG/PNG/WebP)
export const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter(_req: Request, file, cb) {
    if (IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Dozvoljeni formati za avatar: JPEG, PNG, WebP'));
    }
  },
}).single('avatar');
