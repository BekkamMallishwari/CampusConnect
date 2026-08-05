import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

export const configureCloudinary = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (cloud_name && api_key && api_secret) {
    cloudinary.config({
      cloud_name,
      api_key,
      api_secret,
    });
    return true;
  }
  return false;
};

// Initial run
configureCloudinary();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (_req: any, file: any) => {
    const sanitizeName = (file.originalname || 'image')
      .split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, '_');
    const uniquePublicId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${sanitizeName}`;
    return {
      folder: 'campusconnect/lost-found',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      public_id: uniquePublicId,
    };
  },
});

export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  if (!publicId) return null;
  configureCloudinary();
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`[Cloudinary] Deleted image public_id: ${publicId}`, result);
    return result;
  } catch (error) {
    console.error(`[Cloudinary] Error deleting image public_id: ${publicId}`, error);
    return null;
  }
};

export { cloudinary, storage };


