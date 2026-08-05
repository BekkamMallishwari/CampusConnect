import { v2 as cloudinary } from 'cloudinary';

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

export { cloudinary };

