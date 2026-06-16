// backend/socket.js
import { Server } from 'socket.io';
import Notification from './models/Notification.model.js';
import User from './models/user.model.js';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true,
            methods: ["GET", "POST"]
        }
    });

    io.use(async (socket, next) => {
        const userId = socket.handshake.auth.userId;
        if (!userId) {
            return next(new Error("Authentication required"));
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return next(new Error("User not found"));
        }
        
        socket.userId = userId;
        socket.userRole = user.role;
        next();
    });

    io.on('connection', (socket) => {
        console.log(`🔌 User connected: ${socket.userId} (${socket.userRole})`);
        
        // Join user's room
        socket.join(`user_${socket.userId}`);
        
        // Join role-based room
        socket.join(`role_${socket.userRole}`);
        
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`🔌 User disconnected: ${socket.userId}`);
        });
        
        // Handle read notification
        socket.on('mark_read', async (notificationId) => {
            await Notification.findByIdAndUpdate(notificationId, { isRead: true });
        });
        
        // Handle mark all read
        socket.on('mark_all_read', async () => {
            await Notification.updateMany(
                { user: socket.userId, isRead: false },
                { isRead: true }
            );
        });
    });
    
    return io;
};

// Send notification to specific user
export const sendToUser = async (userId, notificationData, saveToDB = true) => {
    try {
        if (saveToDB) {
            const notification = new Notification({
                user: userId,
                ...notificationData
            });
            await notification.save();
            notificationData._id = notification._id;
        }
        
        io?.to(`user_${userId}`).emit('notification', notificationData);
        return true;
    } catch (error) {
        console.error("Error sending notification:", error);
        return false;
    }
};

// Send notification to all users of a role
export const sendToRole = async (role, notificationData, saveToDB = false) => {
    try {
        io?.to(`role_${role}`).emit('notification', notificationData);
        return true;
    } catch (error) {
        console.error("Error sending role notification:", error);
        return false;
    }
};

// Send notification to all online users
export const sendToAll = async (notificationData) => {
    try {
        io?.emit('notification', notificationData);
        return true;
    } catch (error) {
        console.error("Error broadcasting notification:", error);
        return false;
    }
};

export { io };