// backend/controllers/customer.controllers.js
import Restaurant from '../models/restaurant.model.js';
import FoodItem from '../models/foodItem.model.js';
import FoodCategory from '../models/foodCategory.model.js';
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import Wishlist from '../models/wishlist.model.js';

// Get all restaurants (public)
export const getAllRestaurants = async (req, res) => {
    try {
        const { search, cuisine, page = 1, limit = 10 } = req.query;
        
        const filter = { 
            status: 'approved',
            isEnabled: true 
        };
        
        if (search) {
            filter.$or = [
                { businessName: { $regex: search, $options: 'i' } },
                { cuisines: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (cuisine) {
            filter.cuisines = cuisine;
        }
        
        const skip = (page - 1) * limit;
        
        const restaurants = await Restaurant.find(filter)
            .select('businessName description cuisines avgRating bannerImages logoImage mainAddress deliveryTime')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ avgRating: -1, createdAt: -1 });
        
        const total = await Restaurant.countDocuments(filter);
        
        return res.status(200).json({
            success: true,
            restaurants,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error("Get restaurants error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch restaurants" });
    }
};

// Get single restaurant details
export const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const restaurant = await Restaurant.findOne({ 
            _id: id, 
            status: 'approved',
            isEnabled: true 
        }).select('businessName description cuisines avgRating bannerImages logoImage mainAddress deliveryTime phone email');
        
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }
        
        return res.status(200).json({
            success: true,
            restaurant
        });
        
    } catch (error) {
        console.error("Get restaurant error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch restaurant" });
    }
};

// Get restaurant menu (food items)
export const getRestaurantMenu = async (req, res) => {
    try {
        const { id } = req.params;
        const { category } = req.query;
        
        const filter = { 
            restaurant: id,
            isAvailable: true 
        };
        
        if (category) {
            const categoryDoc = await FoodCategory.findOne({ name: category, restaurant: id });
            if (categoryDoc) {
                filter.category = categoryDoc._id;
            }
        }
        
        const foodItems = await FoodItem.find(filter)
            .populate('category', 'name')
            .select('name description price images dietary category');
        
        // Group by category
        const groupedMenu = {};
        foodItems.forEach(item => {
            const categoryName = item.category?.name || 'Uncategorized';
            if (!groupedMenu[categoryName]) {
                groupedMenu[categoryName] = [];
            }
            groupedMenu[categoryName].push(item);
        });
        
        return res.status(200).json({
            success: true,
            menu: groupedMenu,
            items: foodItems
        });
        
    } catch (error) {
        console.error("Get restaurant menu error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch menu" });
    }
};

// Get food item details
export const getFoodItemById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const foodItem = await FoodItem.findOne({ _id: id, isAvailable: true })
            .populate('category', 'name')
            .populate('restaurant', 'businessName avgRating deliveryTime');
        
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }
        
        // Get related items from same category
        const relatedItems = await FoodItem.find({
            category: foodItem.category._id,
            _id: { $ne: id },
            isAvailable: true
        }).limit(5).select('name price images');
        
        return res.status(200).json({
            success: true,
            foodItem,
            relatedItems
        });
        
    } catch (error) {
        console.error("Get food item error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch food item" });
    }
};

// Search food items
export const searchFoodItems = async (req, res) => {
    try {
        const { q, restaurantId, minPrice, maxPrice, dietary, page = 1, limit = 20 } = req.query;
        
        const filter = { isAvailable: true };
        
        if (dietary) {
            filter.dietary = dietary;
        }
        
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ];
        }
        
        if (restaurantId) {
            filter.restaurant = restaurantId;
        }
        
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseFloat(minPrice);
            if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
        }
        
        const skip = (page - 1) * limit;
        
        const items = await FoodItem.find(filter)
            .populate('restaurant', 'businessName avgRating deliveryTime')
            .populate('category', 'name')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });
        
        const total = await FoodItem.countDocuments(filter);
        
        return res.status(200).json({
            success: true,
            items,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total
            }
        });
        
    } catch (error) {
        console.error("Search food items error:", error);
        return res.status(500).json({ error: error.message || "Failed to search" });
    }
};