import multer from 'multer';
import { storage } from '../config/cloudinary';

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image format. Only jpg, jpeg, png, and webp images are allowed.'));
    }
  },
});

// Middleware for uploading up to 5 images
export const uploadImages = upload.array('images', 5);

