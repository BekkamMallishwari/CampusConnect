import fs from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { randomUUID } from 'node:crypto';
import type { Request } from 'express';
import { cloudinary, configureCloudinary } from '../config/cloudinary';

const isCloudinaryConfigured = () => configureCloudinary();

const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), 'uploads');
const LOCAL_LOST_FOUND_ROOT = path.join(LOCAL_UPLOAD_ROOT, 'lost-found');

const sanitizeFileName = (value: string) =>
  value
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'image';

const ensureLocalDir = async () => {
  await fs.mkdir(LOCAL_LOST_FOUND_ROOT, { recursive: true });
};

const uploadBufferToCloudinary = (buffer: Buffer, originalname: string): Promise<{ imageUrl: string; imagePublicId: string }> => {
  return new Promise((resolve, reject) => {
    const publicId = `item_${Date.now()}_${randomUUID().slice(0, 8)}_${sanitizeFileName(originalname)}`;
    console.log(`[LostFoundImage] Uploading to Cloudinary: file="${originalname}", public_id="${publicId}", bufferSize=${buffer.length}`);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'campusconnect/lost-found',
        public_id: publicId,
        resource_type: 'image',
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
      (error, result) => {
        if (error || !result) {
          console.error(`[LostFoundImage] Cloudinary upload failed for "${originalname}":`, error);
          reject(error || new Error('Upload failed'));
          return;
        }
        console.log(`[LostFoundImage] Cloudinary upload success: file="${originalname}", public_id="${result.public_id}", secure_url="${result.secure_url}"`);
        resolve({
          imageUrl: result.secure_url,
          imagePublicId: result.public_id,
        });
      },
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(stream);
  });
};

const saveBufferLocally = async (
  req: Request,
  buffer: Buffer,
  originalname: string,
): Promise<{ imageUrl: string; imagePublicId: string }> => {
  await ensureLocalDir();
  const ext = path.extname(originalname).toLowerCase() || '.jpg';
  const fileName = `${Date.now()}_${randomUUID().slice(0, 8)}_${sanitizeFileName(originalname)}${ext}`;
  const relativePath = path.join('lost-found', fileName).replace(/\\/g, '/');
  const absolutePath = path.join(LOCAL_UPLOAD_ROOT, relativePath);

  await fs.writeFile(absolutePath, buffer);

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const imageUrl = `${baseUrl}/uploads/${relativePath}`;
  const imagePublicId = `local:${relativePath}`;
  console.log(`[LostFoundImage] Local save: file="${originalname}", publicId="${imagePublicId}", url="${imageUrl}"`);
  return {
    imageUrl,
    imagePublicId,
  };
};

export const storeLostFoundImage = async (
  req: Request,
  file: Express.Multer.File,
): Promise<{ imageUrl: string; imagePublicId: string }> => {
  if (isCloudinaryConfigured()) {
    try {
      return await uploadBufferToCloudinary(file.buffer, file.originalname);
    } catch (err) {
      console.error('[LostFoundImage] Cloudinary error, falling back to local storage:', err);
      return saveBufferLocally(req, file.buffer, file.originalname);
    }
  }
  return saveBufferLocally(req, file.buffer, file.originalname);
};

export const storeLostFoundImages = async (
  req: Request,
  files: Express.Multer.File[],
): Promise<Array<{ imageUrl: string; imagePublicId: string }>> => {
  return Promise.all(files.map((file) => storeLostFoundImage(req, file)));
};

export const deleteStoredLostFoundImage = async (identifierOrUrl: string): Promise<void> => {
  if (!identifierOrUrl) return;

  if (identifierOrUrl.startsWith('local:')) {
    const relativePath = identifierOrUrl.slice('local:'.length);
    try {
      await fs.unlink(path.join(LOCAL_UPLOAD_ROOT, relativePath));
    } catch {
      // Ignore local delete errors.
    }
    return;
  }

  if (!isCloudinaryConfigured()) return;

  let publicId = identifierOrUrl;
  if (identifierOrUrl.includes('cloudinary.com')) {
    const segments = identifierOrUrl.split('/');
    const fileName = segments[segments.length - 1].split('.')[0];
    const folder = segments[segments.length - 2];
    publicId = `${folder}/${fileName}`;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // Ignore delete failures so report removal still succeeds.
  }
};

