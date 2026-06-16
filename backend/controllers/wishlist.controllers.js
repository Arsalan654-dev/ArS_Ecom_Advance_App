// backend/controllers/wishlist.controllers.js
import Wishlist from '../models/wishlist.model.js';
import FoodItem from '../models/foodItem.model.js';

// Get user wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.userId;
        
        let wishlist = await Wishlist.findOne({ user: userId })
            .populate('items.foodItem', 'name price images description');
        
        if (!wishlist) {
            wishlist = await Wishlist.create({ user: userId, items: [] });
        }
        
        return res.status(200).json({
            success: true,
            wishlist
        });
        
    } catch (error) {
        console.error("Get wishlist error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch wishlist" });
    }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.userId;
        const { foodItem } = req.body;
        
        if (!foodItem) {
            return res.status(400).json({ error: "Food item required" });
        }
        
        const foodItemData = await FoodItem.findById(foodItem);
        if (!foodItemData) {
            return res.status(404).json({ error: "Food item not found" });
        }
        
        let wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, items: [] });
        }
        
        const alreadyExists = wishlist.items.some(item => item.foodItem.toString() === foodItem);
        
        if (alreadyExists) {
            return res.status(400).json({ error: "Item already in wishlist" });
        }
        
        wishlist.items.push({ foodItem });
        await wishlist.save();
        
        const updatedWishlist = await Wishlist.findById(wishlist._id).populate('items.foodItem', 'name price images');
        
        return res.status(200).json({
            success: true,
            message: "Added to wishlist",
            wishlist: updatedWishlist
        });
        
    } catch (error) {
        console.error("Add to wishlist error:", error);
        return res.status(500).json({ error: error.message || "Failed to add to wishlist" });
    }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.params;
        
        const wishlist = await Wishlist.findOne({ user: userId });
        
        if (!wishlist) {
            return res.status(404).json({ error: "Wishlist not found" });
        }
        
        wishlist.items = wishlist.items.filter(item => item.foodItem.toString() !== itemId);
        await wishlist.save();
        
        return res.status(200).json({
            success: true,
            message: "Removed from wishlist"
        });
        
    } catch (error) {
        console.error("Remove from wishlist error:", error);
        return res.status(500).json({ error: error.message || "Failed to remove from wishlist" });
    }
};