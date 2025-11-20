import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import type { Express } from 'express';
import { config } from '../config/environment.js';

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
});

interface UploadOptions {
    folder: string;
    publicId?: string;
}

export const uploadImageBuffer = (file: Express.Multer.File, options: UploadOptions): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder,
                public_id: options.publicId,
                overwrite: true,
                resource_type: 'image',
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error || !result) {
                    return reject(error || new Error('Cloudinary upload failed'));
                }
                resolve(result);
            }
        );

        uploadStream.end(file.buffer);
    });
};

export const deleteAsset = async (publicId: string): Promise<void> => {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
};

