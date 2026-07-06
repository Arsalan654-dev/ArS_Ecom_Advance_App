// backend/routes/admin.routes.js
import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    getAdminStats,
    getWebhookEvents,
    getWebhookEvent,
    reprocessWebhook,
    getTransactions,
    getPlatformEarnings,
    getStripeAccount,
    adminGetAllRestaurants,
    adminGetRestaurantDetail,
    adminUpdateRestaurantStatus,
    adminGetAllUsers,
    adminUpdateUserRole
} from '../controllers/admin.controllers.js';

const adminRouter = express.Router();

// All admin routes require admin role
adminRouter.use(verifyToken);
adminRouter.use(requireRole(['admin']));

adminRouter.get('/stats', getAdminStats);
adminRouter.get('/webhook-events', getWebhookEvents);
adminRouter.get('/webhook-events/:id', getWebhookEvent);
adminRouter.post('/webhook-events/:id/reprocess', reprocessWebhook);
adminRouter.get('/transactions', getTransactions);
adminRouter.get('/platform-earnings', getPlatformEarnings);
adminRouter.get('/stripe-account', getStripeAccount);

// Restaurant management
adminRouter.get('/restaurants', adminGetAllRestaurants);
adminRouter.get('/restaurants/:id', adminGetRestaurantDetail);
adminRouter.put('/restaurants/:id/status', adminUpdateRestaurantStatus);

// User management
adminRouter.get('/users', adminGetAllUsers);
adminRouter.put('/users/:id/role', adminUpdateUserRole);

export default adminRouter;