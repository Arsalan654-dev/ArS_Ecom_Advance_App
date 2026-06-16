// backend/config/cloudinary.js
import './env.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Memory storage for multer
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

// Function to upload image
const uploadImage = async (file, folder) => {
    try {
        console.log("Uploading image to Cloudinary...", { folder, mimetype: file.mimetype });
        
        // Convert buffer to base64
        const base64 = file.buffer.toString('base64');
        const dataURI = `data:${file.mimetype};base64,${base64}`;
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: folder,
            resource_type: 'auto',
            transformation: [
                { width: 800, height: 800, crop: 'limit' }
            ]
        });
        
        console.log("Upload successful:", result.public_id);
        
        return {
            url: result.secure_url,
            publicId: result.public_id
        };
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

// Function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: options.folder || 'vingo',
                transformation: options.transformation || [
                    { width: 800, height: 800, crop: 'limit' }
                ]
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary stream upload error:", error);
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );
        
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
            const result = await cloudinary.uploader.destroy(publicId);
            console.log("Deleted from Cloudinary:", publicId, result);
            return result;
        }
    } catch (error) {
        console.error("Cloudinary deletion error:", error);
    }
};

// ✅ IMPORTANT: Make sure ALL functions are exported
export { 
    cloudinary, 
    upload, 
    uploadToCloudinary, 
    uploadImage,
    deleteFromCloudinary 
};