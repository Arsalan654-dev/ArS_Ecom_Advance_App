// controllers/restaurant.controllers.js

import Restaurant from '../models/restaurant.model.js';
import User from '../models/user.model.js';
import { uploadImage, deleteFromCloudinary } from "../config/cloudinary.js";

export const createRestaurant = async (req, res) => {
    try {
        const userId = req.userId;
        const { businessName, description, cuisines, phone, email, mainAddress } = req.body;

        if (!businessName || !phone || !email || !mainAddress) {
            return res.status(400).json({
                error: "Business name, phone, email, and address are required"
            });
        }

        const existingRestaurant = await Restaurant.findOne({ owner: userId });
        if (existingRestaurant) {
            return res.status(400).json({
                error: "You already have a restaurant. Delete it first to create a new one."
            });
        }

        const restaurant = new Restaurant({
            owner: userId,
            businessName,
            description,
            cuisines: Array.isArray(cuisines) ? cuisines : [cuisines],
            phone,
            email,
            mainAddress,
            status: 'pending'
        });

        await restaurant.save();

        await User.findByIdAndUpdate(userId, {
            restaurantId: restaurant._id,
            role: 'owner',
            businessName
        });

        const populatedRestaurant = await restaurant.populate('owner', 'fullName email mobile');

        return res.status(201).json({
            success: true,
            message: "Restaurant created successfully (pending admin approval)",
            restaurant: populatedRestaurant
        });

    } catch (error) {
        console.error("Create restaurant error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                error: "Business name already exists"
            });
        }
        return res.status(500).json({
            error: error.message || "Failed to create restaurant"
        });
    }
};

export const getRestaurant = async (req, res) => {
    try {
        const userId = req.userId;

        const restaurant = await Restaurant.findOne({ owner: userId }).populate('owner', 'fullName email mobile phone');

        if (!restaurant) {
            return res.status(404).json({
                error: "No restaurant found for your account"
            });
        }

        const foodItemCount = await (await import('../models/foodItem.model.js')).default.countDocuments({ restaurant: restaurant._id });
        const categoryCount = await (await import('../models/foodCategory.model.js')).default.countDocuments({ restaurant: restaurant._id });

        return res.status(200).json({
            success: true,
            restaurant: {
                ...restaurant.toObject(),
                foodItemCount,
                categoryCount
            }
        });

    } catch (error) {
        console.error("Get restaurant error:", error);
        return res.status(500).json({
            error: error.message || "Failed to fetch restaurant"
        });
    }
};

export const updateRestaurant = async (req, res) => {
    try {
        const userId = req.userId;
        const { businessName, description, cuisines, phone, email, mainAddress, isEnabled } = req.body;

        const restaurant = await Restaurant.findOne({ owner: userId });

        if (!restaurant) {
            return res.status(404).json({
                error: "No restaurant found for your account"
            });
        }

        if (businessName) restaurant.businessName = businessName;
        if (description !== undefined) restaurant.description = description;
        if (cuisines) restaurant.cuisines = Array.isArray(cuisines) ? cuisines : [cuisines];
        if (phone) restaurant.phone = phone;
        if (email) restaurant.email = email;
        if (mainAddress) restaurant.mainAddress = mainAddress;
        if (isEnabled !== undefined) restaurant.isEnabled = isEnabled;

        await restaurant.save();

        if (businessName) {
            await User.findByIdAndUpdate(userId, { businessName });
        }

        const populatedRestaurant = await restaurant.populate('owner', 'fullName email mobile');

        return res.status(200).json({
            success: true,
            message: "Restaurant updated successfully",
            restaurant: populatedRestaurant
        });

    } catch (error) {
        console.error("Update restaurant error:", error);
        if (error.code === 11000) {
            return res.status(400).json({
                error: "Business name already exists"
            });
        }
        return res.status(500).json({
            error: error.message || "Failed to update restaurant"
        });
    }
};

export const uploadRestaurantImages = async (req, res) => {
    try {
        const userId = req.userId;
        const { imageType } = req.body;

        console.log("=== UPLOAD DEBUG ===");
        console.log("userId:", userId);
        console.log("imageType:", imageType);
        
        if (!req.file) {
            return res.status(400).json({
                error: "No image file provided"
            });
        }

        console.log("file:", { 
            originalname: req.file.originalname, 
            mimetype: req.file.mimetype, 
            size: req.file.size 
        });

        if (!['banner', 'logo'].includes(imageType)) {
            return res.status(400).json({
                error: "Invalid image type. Must be 'banner' or 'logo'"
            });
        }

        const restaurant = await Restaurant.findOne({ owner: userId });

        if (!restaurant) {
            return res.status(404).json({
                error: "No restaurant found for your account"
            });
        }

        console.log("Restaurant found:", restaurant._id);

        // Upload to Cloudinary
        const folder = `restaurants/${restaurant._id}`;
        
        // ✅ Now uploadImage should work
        const result = await uploadImage(req.file, folder);
        
        console.log("Upload result:", result);

        if (imageType === 'banner') {
            restaurant.bannerImages.push({
                url: result.url,
                publicId: result.publicId
            });

            // Keep only last 5 banner images
            if (restaurant.bannerImages.length > 5) {
                const oldImage = restaurant.bannerImages.shift();
                if (oldImage.publicId) {
                    await deleteFromCloudinary(oldImage.publicId);
                }
            }
        } else if (imageType === 'logo') {
            // Delete old logo if exists
            if (restaurant.logoImage?.publicId) {
                await deleteFromCloudinary(restaurant.logoImage.publicId);
            }

            restaurant.logoImage = {
                url: result.url,
                publicId: result.publicId
            };
        }

        await restaurant.save();

        return res.status(200).json({
            success: true,
            message: `${imageType} image uploaded successfully`,
            restaurant: {
                ...restaurant.toObject(),
                bannerImages: restaurant.bannerImages,
                logoImage: restaurant.logoImage
            }
        });

    } catch (error) {
        console.error("Upload restaurant images error:", error);
        return res.status(500).json({
            error: error.message || "Failed to upload image"
        });
    }
};
export const deleteRestaurant = async (req, res) => {
    try {
        const userId = req.userId;
        const { confirmation } = req.body;

        if (confirmation !== "DELETE_RESTAURANT") {
            return res.status(400).json({
                error: "Invalid confirmation code"
            });
        }

        const restaurant = await Restaurant.findOne({ owner: userId });

        if (!restaurant) {
            return res.status(404).json({
                error: "No restaurant found for your account"
            });
        }

        await restaurant.deleteOne();

        await User.findByIdAndUpdate(userId, {
            restaurantId: null,
            role: 'user',
            businessName: null
        });

        return res.status(200).json({
            success: true,
            message: "Restaurant deleted successfully"
        });

    } catch (error) {
        console.error("Delete restaurant error:", error);
        return res.status(500).json({
            error: error.message || "Failed to delete restaurant"
        });
    }
};
