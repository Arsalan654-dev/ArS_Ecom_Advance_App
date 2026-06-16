// backend/routes/notification.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    createNotification
} from '../controllers/notification.controllers.js';

const notificationRouter = express.Router();

notificationRouter.get('/', verifyToken, getUserNotifications);
notificationRouter.put('/:id/read', verifyToken, markAsRead);
notificationRouter.put('/read-all', verifyToken, markAllAsRead);
notificationRouter.delete('/:id', verifyToken, deleteNotification);
notificationRouter.delete('/', verifyToken, deleteAllNotifications);

// Admin only
notificationRouter.post('/admin', verifyToken, createNotification);

export default notificationRouter;