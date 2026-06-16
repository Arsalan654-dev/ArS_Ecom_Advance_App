// models/deliveryZone.model.js

import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
        required: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    minOrderValue: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscount: {
        type: Number,
        default: null,
        min: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUpto: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    timesUsed: {
        type: Number,
        default: 0
    },
    applicableCategories: [{
        type: String
    }],
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

promoCodeSchema.index({ restaurant: 1 });
promoCodeSchema.index({ code: 1, restaurant: 1 }, { unique: true });

const PromoCode = mongoose.model("PromoCode", promoCodeSchema);
export default PromoCode;
