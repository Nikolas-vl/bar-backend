import multer from 'multer';
import path from 'path';

const ALLOWED_TYPES = /jpeg|jpg|png|webp/;

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extValid = ALLOWED_TYPES.test(path.extname(file.originalname).toLowerCase().replace('.', ''));
    const mimeValid = ALLOWED_TYPES.test(file.mimetype.replace('image/', ''));

    if (extValid && mimeValid) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});
