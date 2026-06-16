// backend/controllers/cart.controllers.js
import Cart from '../models/cart.model.js';
import FoodItem from '../models/foodItem.model.js';

// Get user cart
export const getCart = async (req, res) => {
    try {
        const userId = req.userId;
        
        let cart = await Cart.findOne({ user: userId })
            .populate('items.foodItem', 'name price images restaurant');
        
        if (!cart) {
            cart = await Cart.create({ user: userId, items: [] });
        }
        
        // Get restaurantId from first cart item (if any)
        let restaurantId = null;
        if (cart.items.length > 0 && cart.items[0].foodItem?.restaurant) {
            restaurantId = cart.items[0].foodItem.restaurant;
        }
        
        const totalAmount = cart.items.reduce((sum, item) => {
            return sum + ((item.price || item.foodItem?.price || 0) * (item.quantity || 0));
        }, 0);
        
        return res.status(200).json({
            success: true,
            cart: {
                _id: cart._id,
                items: cart.items,
                totalAmount,
                itemCount: cart.items.length,
                restaurantId: restaurantId  // ✅ ADD THIS
            }
        });
        
    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch cart" });
    }
};
// Add item to cart
export const addToCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { foodItem, quantity } = req.body;
        
        if (!foodItem || !quantity || quantity < 1) {
            return res.status(400).json({ error: "Food item and valid quantity required" });
        }
        
        const foodItemData = await FoodItem.findById(foodItem);
        if (!foodItemData) {
            return res.status(404).json({ error: "Food item not found" });
        }
        
        let cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }
        
        const existingItem = cart.items.find(item => item.foodItem.toString() === foodItem);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.price = foodItemData.price;
        } else {
            cart.items.push({
                foodItem: foodItem,
                quantity: quantity,
                price: foodItemData.price
            });
        }
        
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate('items.foodItem', 'name price images');
        
        return res.status(200).json({
            success: true,
            message: "Item added to cart",
            cart: updatedCart
        });
        
    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({ error: error.message || "Failed to add to cart" });
    }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.params;
        const { quantity } = req.body;
        
        if (quantity < 0) {
            return res.status(400).json({ error: "Invalid quantity" });
        }
        
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }
        
        const itemIndex = cart.items.findIndex(item => item.foodItem.toString() === itemId);
        
        if (itemIndex === -1) {
            return res.status(404).json({ error: "Item not found in cart" });
        }
        
        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            cart.items[itemIndex].quantity = quantity;
        }
        
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate('items.foodItem', 'name price images');
        
        return res.status(200).json({
            success: true,
            message: quantity === 0 ? "Item removed from cart" : "Cart updated",
            cart: updatedCart
        });
        
    } catch (error) {
        console.error("Update cart error:", error);
        return res.status(500).json({ error: error.message || "Failed to update cart" });
    }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
    try {
        const userId = req.userId;
        const { itemId } = req.params;
        
        const cart = await Cart.findOne({ user: userId });
        
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }
        
        cart.items = cart.items.filter(item => item.foodItem.toString() !== itemId);
        await cart.save();
        
        const updatedCart = await Cart.findById(cart._id).populate('items.foodItem', 'name price images');
        
        return res.status(200).json({
            success: true,
            message: "Item removed from cart",
            cart: updatedCart
        });
        
    } catch (error) {
        console.error("Remove from cart error:", error);
        return res.status(500).json({ error: error.message || "Failed to remove from cart" });
    }
};

// Clear cart
export const clearCart = async (req, res) => {
    try {
        const userId = req.userId;
        
        const cart = await Cart.findOne({ user: userId });
        
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        
        return res.status(200).json({
            success: true,
            message: "Cart cleared"
        });
        
    } catch (error) {
        console.error("Clear cart error:", error);
        return res.status(500).json({ error: error.message || "Failed to clear cart" });
    }
};