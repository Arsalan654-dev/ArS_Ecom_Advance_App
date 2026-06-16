// backend/models/wishlist.model.js
import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
    foodItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FoodItem",
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    items: [wishlistItemSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;