// backend/routes/delivery.routes.js
import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    getAssignedOrders,
    getDeliveryHistory,
    updateDeliveryStatus,
    getDeliveryEarnings,
    updateLocation,
    getDeliveryOrderDetail,
    getRecentDeliveries,
    deleteDelivery,
    deleteAllDeliveries  // ✅ Add this import
} from '../controllers/delivery.controllers.js';

const deliveryRouter = express.Router();

deliveryRouter.use(verifyToken);
deliveryRouter.use(requireRole(['deliveryBoy']));

// ✅ IMPORTANT: Put specific routes BEFORE generic ones
deliveryRouter.get('/assigned-orders', getAssignedOrders);
deliveryRouter.get('/history', getDeliveryHistory);
deliveryRouter.get('/earnings', getDeliveryEarnings);
deliveryRouter.get('/recent-deliveries', getRecentDeliveries);

// ✅ Delete all route - MUST come before /:deliveryId
deliveryRouter.delete('/all', deleteAllDeliveries);

// ✅ Generic routes - keep at the end
deliveryRouter.get('/orders/:orderId', getDeliveryOrderDetail);
deliveryRouter.put('/orders/:orderId/status', updateDeliveryStatus);
deliveryRouter.put('/location', updateLocation);
deliveryRouter.delete('/:deliveryId', deleteDelivery);

export default deliveryRouter;