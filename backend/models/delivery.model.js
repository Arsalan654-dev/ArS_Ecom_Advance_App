// backend/models/delivery.model.js (Add location tracking fields)
import mongoose from "mongoose";

const locationHistorySchema = new mongoose.Schema({
    coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    speed: Number,
    accuracy: Number
});

const deliverySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    deliveryBoy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    assignedAt: {
        type: Date,
        default: Date.now
    },
    pickedUpAt: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    deliveryLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    currentLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        },
        lastUpdate: {
            type: Date,
            default: Date.now
        }
    },
    locationHistory: [locationHistorySchema],
    distanceKm: {
        type: Number,
        default: 0
    },
    estimatedTime: {
        type: Number,
        default: 0
    },
    actualDeliveryTime: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['assigned', 'picked_up', 'delivered'],
        default: 'assigned'
    },
    earnings: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for geo queries
deliverySchema.index({ currentLocation: "2dsphere" });
deliverySchema.index({ deliveryBoy: 1 });
deliverySchema.index({ order: 1 }, { unique: true });

const Delivery = mongoose.model("Delivery", deliverySchema);
export default Delivery;