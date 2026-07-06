// backend/routes/cart.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} from '../controllers/cart.controllers.js';

const cartRouter = express.Router();

// All cart routes require authentication
cartRouter.get('/', verifyToken, getCart);
cartRouter.post('/', verifyToken, addToCart);
cartRouter.put('/:itemId', verifyToken, updateCartItem);
cartRouter.delete('/:itemId', verifyToken, removeFromCart);
cartRouter.delete('/', verifyToken, clearCart);

export default cartRouter;
