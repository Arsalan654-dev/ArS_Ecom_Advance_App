// models/deliveryZone.model.js

import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema({
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
    description: {
        type: String,
        trim: true,
        default: ""
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodCategory",
        required: true
    },
    images: [{
        url: String,
        publicId: String
    }],
    dietary: {
        type: String,
        enum: ["vegetarian", "non-vegetarian", "vegan", "gluten-free"],
        default: "vegetarian"
    },
    isAvailable: {
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

foodItemSchema.index({ restaurant: 1 });
foodItemSchema.index({ category: 1 });

const FoodItem = mongoose.model("FoodItem", foodItemSchema);
export default FoodItem;
