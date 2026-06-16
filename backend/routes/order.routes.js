// backend/routes/order.routes.js
import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    getRestaurantOrders,
    getOrderDetail,
    updateOrderStatus,
    getOrderStats
} from '../controllers/order.controllers.js';

const orderRouter = express.Router();

// ✅ Owner routes - show ALL orders except cancelled
orderRouter.get('/', verifyToken, requireRole(['owner']), getRestaurantOrders);
orderRouter.get('/stats', verifyToken, requireRole(['owner']), getOrderStats);
orderRouter.get('/:orderId', verifyToken, requireRole(['owner']), getOrderDetail);
orderRouter.put('/:orderId/status', verifyToken, requireRole(['owner']), updateOrderStatus);

export default orderRouter;