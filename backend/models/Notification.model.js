// backend/models/Notification.model.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: [
            'order_placed', 
            'order_preparing', 
            'order_ready', 
            'order_out_for_delivery', 
            'order_delivered', 
            'order_cancelled', 
            'promo_code', 
            'payment_received',
            'new_order',  // ✅ ADD THIS for restaurant owner
            'delivery_assigned', 
            'delivery_picked_up', 
            'delivery_completed', 
            'rating_request'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    isRead: {
        type: Boolean,
        default: false
    },
    image: String,
    link: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 30*24*60*60*1000)
    }
});

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;