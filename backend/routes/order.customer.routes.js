// backend/routes/order.customer.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    deleteOrder,
    deleteAllOrders
} from '../controllers/order.customer.controllers.js';

const orderCustomerRouter = express.Router();

orderCustomerRouter.post('/orders', verifyToken, createOrder);
orderCustomerRouter.get('/orders/my-orders', verifyToken, getMyOrders);
orderCustomerRouter.get('/orders/:orderId', verifyToken, getOrderById);
orderCustomerRouter.put('/orders/:orderId/cancel', verifyToken, cancelOrder);

// ✅ IMPORTANT: Put /all route BEFORE the /:orderId route
orderCustomerRouter.delete('/orders/all', verifyToken, deleteAllOrders);
orderCustomerRouter.delete('/orders/:orderId', verifyToken, deleteOrder);

export default orderCustomerRouter;