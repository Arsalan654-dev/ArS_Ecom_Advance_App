// models/deliveryZone.model.js

import mongoose from "mongoose";

const deliveryZoneSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    centerLat: {
        type: Number,
        required: true
    },
    centerLon: {
        type: Number,
        required: true
    },
    radiusKm: {
        type: Number,
        required: true,
        min: 0.1,
        default: 1
    },
    deliveryChargeFlatRate: {
        type: Number,
        default: 0,
        min: 0
    },
    freeDeliveryAbove: {
        type: Number,
        default: null
    },
    estimatedTimeMinutes: {
        type: Number,
        default: 30
    },
    isActive: {
        type: Boolean,
        default: true
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

deliveryZoneSchema.index({ restaurant: 1 });

const DeliveryZone = mongoose.model("DeliveryZone", deliveryZoneSchema);
export default DeliveryZone;
