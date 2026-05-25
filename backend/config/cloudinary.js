import './env.js';

// D:\Vingo\backend\config\cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Memory storage for multer (store file in memory buffer)
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

// Create multer upload instance
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                transformation: [
                    { width: 500, height: 500, crop: 'limit' }
                ]
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        
        // Create readable stream from buffer
        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

// Function to delete image from Cloudinary
const deleteFromCloudinary = async (publicId) => {
    try {
        if (publicId) {
            await cloudinary.uploader.destroy(publicId);
            console.log("Deleted from Cloudinary:", publicId);
        }
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
    }
};

export { cloudinary, upload, uploadToCloudinary, deleteFromCloudinary };
