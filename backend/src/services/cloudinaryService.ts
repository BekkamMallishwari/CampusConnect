import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';

const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
  });
}

// Always use memory storage; we handle upload to Cloudinary manually
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadBufferToCloudinary = (buffer: Buffer, filename: string): Promise<string> => {
  if (!isCloudinaryConfigured()) {
    // Return deterministic placeholder for dev
    return Promise.resolve(`https://picsum.photos/seed/${encodeURIComponent(filename)}/600/400`);
  }
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'campusconnect/lost-found',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result.secure_url);
      },
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

export const uploadMultipleImages = async (files: Express.Multer.File[]): Promise<string[]> => {
  const urls = await Promise.all(files.map((f) => uploadBufferToCloudinary(f.buffer, f.originalname)));
  return urls;
};

export const deleteCloudinaryImage = async (publicIdOrUrl: string): Promise<void> => {
  if (!isCloudinaryConfigured()) return;
  try {
    // If a URL is passed, extract the public ID
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const parts = publicIdOrUrl.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      const folder = parts[parts.length - 2];
      publicId = `${folder}/${filename}`;
    }
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('[Cloudinary] Failed to delete image:', err);
  }
};

// Middleware to upload images after multer memoryStorage
export const uploadImagesToCloud = (fieldName: string, maxCount = 5) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.files || !Array.isArray(req.files)) return next();
    try {
      const urls = await uploadMultipleImages(req.files as Express.Multer.File[]);
      (req as any).uploadedImageUrls = urls;
      next();
    } catch (err) {
      next(err);
    }
  };
};
