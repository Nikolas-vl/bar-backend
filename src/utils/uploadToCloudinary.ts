import cloudinary from './cloudinary';
import { UploadApiResponse } from 'cloudinary';

export const uploadImage = (buffer: Buffer, folder = 'dishes'): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Upload failed'));
        resolve(result);
      })
      .end(buffer);
  });
};

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

export const optimizedUrl = (publicId: string, width = 800, height = 600) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  });
};
