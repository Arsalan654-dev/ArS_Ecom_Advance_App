// backend/routes/customer.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    getAllRestaurants,
    getRestaurantById,
    getRestaurantMenu,
    getFoodItemById,
    searchFoodItems
} from '../controllers/customer.controllers.js';
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist
} from '../controllers/wishlist.controllers.js';

const customerRouter = express.Router();

// Public routes (no auth required)
customerRouter.get('/restaurants', getAllRestaurants);
customerRouter.get('/restaurants/:id', getRestaurantById);
customerRouter.get('/restaurants/:id/menu', getRestaurantMenu);
customerRouter.get('/food-items/:id', getFoodItemById);
customerRouter.get('/search', searchFoodItems);

// Wishlist - kept here for backward compatibility
customerRouter.get('/wishlist', verifyToken, getWishlist);
customerRouter.post('/wishlist', verifyToken, addToWishlist);
customerRouter.delete('/wishlist/:itemId', verifyToken, removeFromWishlist);

export default customerRouter;