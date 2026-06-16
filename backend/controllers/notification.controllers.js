// backend/controllers/notification.controllers.js
import Notification from '../models/Notification.model.js';
import { sendToUser } from '../socket.js';

// Get user notifications
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 20, unreadOnly = false } = req.query;
        
        const skip = (page - 1) * limit;
        const filter = { user: userId };
        
        if (unreadOnly === 'true') {
            filter.isRead = false;
        }
        
        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const unreadCount = await Notification.countDocuments({ 
            user: userId, 
            isRead: false 
        });
        
        const total = await Notification.countDocuments(filter);
        
        res.json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
        
    } catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        
        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: userId },
            { isRead: true },
            { new: true }
        );
        
        if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
        }
        
        res.json({ success: true, notification });
        
    } catch (error) {
        console.error("Mark as read error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        
        await Notification.updateMany(
            { user: userId, isRead: false },
            { isRead: true }
        );
        
        res.json({ success: true });
        
    } catch (error) {
        console.error("Mark all as read error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete notification
export const deleteNotification = async (req, res) => {
    try {
        const userId = req.userId;
        const { id } = req.params;
        
        const result = await Notification.deleteOne({ _id: id, user: userId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }
        
        res.json({ success: true });
        
    } catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        
        await Notification.deleteMany({ user: userId });
        
        res.json({ success: true });
        
    } catch (error) {
        console.error("Delete all notifications error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Create custom notification (for admin)
export const createNotification = async (req, res) => {
    try {
        const { userId, title, message, type, data, link } = req.body;
        
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type: type || 'custom',
            data,
            link
        });
        
        // Send real-time notification
        await sendToUser(userId, notification.toObject());
        
        res.json({ success: true, notification });
        
    } catch (error) {
        console.error("Create notification error:", error);
        res.status(500).json({ error: error.message });
    }
};