import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    createRestaurant,
    getRestaurant,
    updateRestaurant,
    uploadRestaurantImages,
    deleteRestaurant
} from '../controllers/restaurant.controllers.js';
import multer from 'multer';

const restaurantRouter = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

restaurantRouter.post('/', verifyToken, requireRole(['owner']), createRestaurant);
restaurantRouter.get('/', verifyToken, requireRole(['owner']), getRestaurant);
restaurantRouter.put('/', verifyToken, requireRole(['owner']), updateRestaurant);
restaurantRouter.post('/upload-images', verifyToken, requireRole(['owner']), upload.single('image'), uploadRestaurantImages);
restaurantRouter.delete('/', verifyToken, requireRole(['owner']), deleteRestaurant);

export default restaurantRouter;