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
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from '../controllers/cart.controllers.js';
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

// Protected routes (auth required)
customerRouter.get('/cart', verifyToken, getCart);
customerRouter.post('/cart', verifyToken, addToCart);
customerRouter.put('/cart/:itemId', verifyToken, updateCartItem);
customerRouter.delete('/cart/:itemId', verifyToken, removeFromCart);
customerRouter.delete('/cart', verifyToken, clearCart);

customerRouter.get('/wishlist', verifyToken, getWishlist);
customerRouter.post('/wishlist', verifyToken, addToWishlist);
customerRouter.delete('/wishlist/:itemId', verifyToken, removeFromWishlist);

export default customerRouter;