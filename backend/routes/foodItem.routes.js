// routes/foodItem.routes.js

import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    createFoodItem,
    getFoodItems,
    updateFoodItem,
    uploadFoodImages,
    deleteFoodItem
} from '../controllers/foodItem.controllers.js';
import multer from 'multer';

const foodItemRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Category routes
foodItemRouter.post('/category', verifyToken, requireRole(['owner']), createCategory);
foodItemRouter.get('/category', verifyToken, requireRole(['owner']), getCategories);
foodItemRouter.put('/category/:categoryId', verifyToken, requireRole(['owner']), updateCategory);
foodItemRouter.delete('/category/:categoryId', verifyToken, requireRole(['owner']), deleteCategory);

// Food item routes
foodItemRouter.post('/', verifyToken, requireRole(['owner']), createFoodItem);
foodItemRouter.get('/', verifyToken, requireRole(['owner']), getFoodItems);
foodItemRouter.put('/:itemId', verifyToken, requireRole(['owner']), updateFoodItem);
foodItemRouter.post('/:itemId/images', verifyToken, requireRole(['owner']), upload.array('images', 5), uploadFoodImages);
foodItemRouter.delete('/:itemId', verifyToken, requireRole(['owner']), deleteFoodItem);

export default foodItemRouter;
