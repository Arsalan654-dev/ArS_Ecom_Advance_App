// controllers/foodItem.controllers.js

import FoodItem from '../models/foodItem.model.js';
import FoodCategory from '../models/foodCategory.model.js';
import Restaurant from '../models/restaurant.model.js';
import {uploadImage, deleteFromCloudinary } from '../config/cloudinary.js';

// ════════════════════════════════════════════════════════
// FOOD CATEGORY ENDPOINTS
// ════════════════════════════════════════════════════════

export const createCategory = async (req, res) => {
    try {
        const userId = req.userId;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const category = new FoodCategory({
            restaurant: restaurant._id,
            name
        });

        await category.save();

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            category
        });

    } catch (error) {
        console.error("Create category error:", error);
        return res.status(500).json({ error: error.message || "Failed to create category" });
    }
};

export const getCategories = async (req, res) => {
    try {
        const userId = req.userId;

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const categories = await FoodCategory.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            categories
        });

    } catch (error) {
        console.error("Get categories error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch categories" });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, isActive } = req.body;
        const userId = req.userId;

        const category = await FoodCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        const restaurant = await Restaurant.findById(category.restaurant);
        if (restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this restaurant" });
        }

        if (name) category.name = name;
        if (isActive !== undefined) category.isActive = isActive;

        await category.save();

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            category
        });

    } catch (error) {
        console.error("Update category error:", error);
        return res.status(500).json({ error: error.message || "Failed to update category" });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userId = req.userId;

        const category = await FoodCategory.findById(categoryId);
        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        const restaurant = await Restaurant.findById(category.restaurant);
        if (restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this restaurant" });
        }

        await category.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });

    } catch (error) {
        console.error("Delete category error:", error);
        return res.status(500).json({ error: error.message || "Failed to delete category" });
    }
};

// ════════════════════════════════════════════════════════
// FOOD ITEM ENDPOINTS
// ════════════════════════════════════════════════════════

export const createFoodItem = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description, price, categoryId, dietary } = req.body;

        if (!name || !price || !categoryId) {
            return res.status(400).json({ error: "Name, price, and category are required" });
        }

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const category = await FoodCategory.findById(categoryId);
        if (!category || category.restaurant.toString() !== restaurant._id.toString()) {
            return res.status(404).json({ error: "Category not found" });
        }

        const foodItem = new FoodItem({
            restaurant: restaurant._id,
            name,
            description,
            price,
            category: categoryId,
            dietary: dietary || 'vegetarian'
        });

        await foodItem.save();

        return res.status(201).json({
            success: true,
            message: "Food item created successfully",
            foodItem
        });

    } catch (error) {
        console.error("Create food item error:", error);
        return res.status(500).json({ error: error.message || "Failed to create food item" });
    }
};

export const getFoodItems = async (req, res) => {
    try {
        const userId = req.userId;
        const { categoryId, isAvailable, page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const filter = { restaurant: restaurant._id };

        if (categoryId) filter.category = categoryId;
        if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

        const skip = (page - 1) * limit;
        const foodItems = await FoodItem.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate('category', 'name');

        const total = await FoodItem.countDocuments(filter);

        return res.status(200).json({
            success: true,
            foodItems,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit)
            }
        });

    } catch (error) {
        console.error("Get food items error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch food items" });
    }
};

export const updateFoodItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { name, description, price, categoryId, dietary, isAvailable } = req.body;
        const userId = req.userId;

        const foodItem = await FoodItem.findById(itemId).populate('restaurant');
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }

        if (foodItem.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this food item" });
        }

        if (name) foodItem.name = name;
        if (description !== undefined) foodItem.description = description;
        if (price) foodItem.price = price;
        if (categoryId) foodItem.category = categoryId;
        if (dietary) foodItem.dietary = dietary;
        if (isAvailable !== undefined) foodItem.isAvailable = isAvailable;

        await foodItem.save();

        return res.status(200).json({
            success: true,
            message: "Food item updated successfully",
            foodItem
        });

    } catch (error) {
        console.error("Update food item error:", error);
        return res.status(500).json({ error: error.message || "Failed to update food item" });
    }
};

export const uploadFoodImages = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.userId;

        console.log("Food image upload request:", { itemId, userId, filesCount: req.files?.length });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No image files provided" });
        }

        const foodItem = await FoodItem.findById(itemId).populate('restaurant');
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }

        if (foodItem.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this food item" });
        }

        const uploadedImages = [];

        for (const file of req.files) {
            const folder = `restaurants/${foodItem.restaurant._id}/food-items/${itemId}`;
            const result = await uploadImage(file, folder);
            
            uploadedImages.push({
                url: result.url,
                publicId: result.publicId
            });
        }

        // Append new images to existing ones
        foodItem.images = [...(foodItem.images || []), ...uploadedImages];
        await foodItem.save();

        return res.status(200).json({
            success: true,
            message: `${uploadedImages.length} image(s) uploaded successfully`,
            foodItem
        });

    } catch (error) {
        console.error("Upload food images error:", error);
        return res.status(500).json({ error: error.message || "Failed to upload images" });
    }
};

export const deleteFoodItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.userId;

        const foodItem = await FoodItem.findById(itemId).populate('restaurant');
        if (!foodItem) {
            return res.status(404).json({ error: "Food item not found" });
        }

        if (foodItem.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this food item" });
        }

        if (foodItem.images && foodItem.images.length > 0) {
            for (const image of foodItem.images) {
                await deleteFromCloudinary(image.publicId);
            }
        }

        await foodItem.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Food item deleted successfully"
        });

    } catch (error) {
        console.error("Delete food item error:", error);
        return res.status(500).json({ error: error.message || "Failed to delete food item" });
    }
};
