import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';
import fs from 'node:fs/promises';
import path from 'node:path';

const getCloudinaryConfig = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({ cloud_name, api_key, api_secret });
    return { cloud_name, api_key, api_secret };
  }
  return null;
};

const sanitizeFileName = (value: string) =>
  value
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'image';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG, PNG, WEBP, and GIF are allowed.`));
    }
  },
});

export const uploadBufferToCloudinary = async (buffer: Buffer, filename: string, req?: Request): Promise<string> => {
  const uniquePublicId = `item_${Date.now()}_${randomUUID().slice(0, 8)}_${sanitizeFileName(filename)}`;
  const config = getCloudinaryConfig();

  if (!config) {
    console.warn(`[Cloudinary:Warn] Credentials missing. Saving file "${filename}" locally to uploads folder...`);
    const uploadsDir = path.resolve(process.cwd(), 'uploads', 'lost-found');
    await fs.mkdir(uploadsDir, { recursive: true });
    const localFileName = `${uniquePublicId}.jpg`;
    const localFilePath = path.join(uploadsDir, localFileName);
    await fs.writeFile(localFilePath, buffer);

    const baseUrl = req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5001';
    const localUrl = `${baseUrl}/uploads/lost-found/${localFileName}`;
    console.log(`[Cloudinary:LocalFallback] Uploaded "${filename}" → ${localUrl}`);
    return localUrl;
  }

  return new Promise((resolve, reject) => {
    console.log(`[Cloudinary:Uploading] File="${filename}", size=${buffer.length} bytes, public_id="${uniquePublicId}"`);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'campusconnect/lost-found',
        public_id: uniquePublicId,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          console.error(`[Cloudinary:ERROR] Upload failed for file "${filename}":`, error);
          return reject(error || new Error(`Cloudinary upload failed for "${filename}"`));
        }
        console.log(`[Cloudinary:SUCCESS] File="${filename}" → public_id="${result.public_id}", url="${result.secure_url}"`);
        resolve(result.secure_url);
      },
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

export const uploadMultipleImages = async (files: Express.Multer.File[], req?: Request): Promise<string[]> => {
  const urls = await Promise.all(files.map((f) => uploadBufferToCloudinary(f.buffer, f.originalname, req)));
  return urls;
};

export const deleteCloudinaryImage = async (publicIdOrUrl: string): Promise<void> => {
  const config = getCloudinaryConfig();
  if (!config || !publicIdOrUrl) return;
  try {
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      const parts = publicIdOrUrl.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      const folder = parts[parts.length - 2];
      publicId = `${folder}/${filename}`;
    }
    await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Deleted image public_id: ${publicId}`);
  } catch (err) {
    console.error('[Cloudinary] Failed to delete image:', err);
  }
};

export const uploadImagesToCloud = (fieldName: string, maxCount = 5) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.files || !Array.isArray(req.files)) return next();
    try {
      const urls = await uploadMultipleImages(req.files as Express.Multer.File[], req);
      (req as any).uploadedImageUrls = urls;
      next();
    } catch (err) {
      next(err);
    }
  };
};

