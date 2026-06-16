// controllers/promoCode.controllers.js

import PromoCode from '../models/promoCode.model.js';
import Restaurant from '../models/restaurant.model.js';

export const createPromoCode = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            code,
            discountPercentage,
            minOrderValue,
            maxDiscount,
            validFrom,
            validUpto,
            usageLimit,
            applicableCategories
        } = req.body;

        if (!code || discountPercentage === undefined || !validFrom || !validUpto) {
            return res.status(400).json({
                error: "Code, discount percentage, and validity dates are required"
            });
        }

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const existingCode = await PromoCode.findOne({
            restaurant: restaurant._id,
            code: code.toUpperCase()
        });

        if (existingCode) {
            return res.status(400).json({ error: "Promo code already exists for your restaurant" });
        }

        const promoCode = new PromoCode({
            restaurant: restaurant._id,
            code: code.toUpperCase(),
            discountPercentage,
            minOrderValue: minOrderValue || 0,
            maxDiscount: maxDiscount || null,
            validFrom: new Date(validFrom),
            validUpto: new Date(validUpto),
            usageLimit: usageLimit || null,
            applicableCategories: applicableCategories || []
        });

        await promoCode.save();

        return res.status(201).json({
            success: true,
            message: "Promo code created successfully",
            promoCode
        });

    } catch (error) {
        console.error("Create promo code error:", error);
        return res.status(500).json({ error: error.message || "Failed to create promo code" });
    }
};

export const getPromoCodes = async (req, res) => {
    try {
        const userId = req.userId;
        const { isActive, page = 1, limit = 10 } = req.query;

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const filter = { restaurant: restaurant._id };
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const skip = (page - 1) * limit;
        const promoCodes = await PromoCode.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await PromoCode.countDocuments(filter);

        return res.status(200).json({
            success: true,
            promoCodes,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit)
            }
        });

    } catch (error) {
        console.error("Get promo codes error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch promo codes" });
    }
};

export const updatePromoCode = async (req, res) => {
    try {
        const { codeId } = req.params;
        const {
            code,
            discountPercentage,
            minOrderValue,
            maxDiscount,
            validFrom,
            validUpto,
            usageLimit,
            applicableCategories,
            isActive
        } = req.body;
        const userId = req.userId;

        const promoCode = await PromoCode.findById(codeId).populate('restaurant');
        if (!promoCode) {
            return res.status(404).json({ error: "Promo code not found" });
        }

        if (promoCode.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this promo code" });
        }

        if (code) promoCode.code = code.toUpperCase();
        if (discountPercentage !== undefined) promoCode.discountPercentage = discountPercentage;
        if (minOrderValue !== undefined) promoCode.minOrderValue = minOrderValue;
        if (maxDiscount !== undefined) promoCode.maxDiscount = maxDiscount;
        if (validFrom) promoCode.validFrom = new Date(validFrom);
        if (validUpto) promoCode.validUpto = new Date(validUpto);
        if (usageLimit !== undefined) promoCode.usageLimit = usageLimit;
        if (applicableCategories) promoCode.applicableCategories = applicableCategories;
        if (isActive !== undefined) promoCode.isActive = isActive;

        await promoCode.save();

        return res.status(200).json({
            success: true,
            message: "Promo code updated successfully",
            promoCode
        });

    } catch (error) {
        console.error("Update promo code error:", error);
        return res.status(500).json({ error: error.message || "Failed to update promo code" });
    }
};

export const deletePromoCode = async (req, res) => {
    try {
        const { codeId } = req.params;
        const userId = req.userId;

        const promoCode = await PromoCode.findById(codeId).populate('restaurant');
        if (!promoCode) {
            return res.status(404).json({ error: "Promo code not found" });
        }

        if (promoCode.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this promo code" });
        }

        await promoCode.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Promo code deleted successfully"
        });

    } catch (error) {
        console.error("Delete promo code error:", error);
        return res.status(500).json({ error: error.message || "Failed to delete promo code" });
    }
};

export const validatePromoCode = async (req, res) => {
    try {
        const { code, restaurantId, orderValue } = req.body;

        console.log("Promo validation request:", { code, restaurantId, orderValue });

        if (!code) {
            return res.status(400).json({
                error: "Promo code is required"
            });
        }

        if (!restaurantId) {
            return res.status(400).json({
                error: "Restaurant ID is required"
            });
        }

        const promoCode = await PromoCode.findOne({
            restaurant: restaurantId,
            code: code.toUpperCase(),
            isActive: true
        });

        if (!promoCode) {
            return res.status(404).json({
                error: "Invalid promo code"
            });
        }

        const now = new Date();
        if (now < promoCode.validFrom || now > promoCode.validUpto) {
            return res.status(400).json({
                error: "Promo code is not valid at this time"
            });
        }

        if (promoCode.usageLimit && promoCode.timesUsed >= promoCode.usageLimit) {
            return res.status(400).json({
                error: "Promo code usage limit exceeded"
            });
        }

        if (orderValue && orderValue < promoCode.minOrderValue) {
            return res.status(400).json({
                error: `Minimum order value of ₨ ${promoCode.minOrderValue} required`
            });
        }

        const discountAmount = (orderValue || 0) * (promoCode.discountPercentage / 100);
        const finalDiscount = promoCode.maxDiscount
            ? Math.min(discountAmount, promoCode.maxDiscount)
            : discountAmount;

        return res.status(200).json({
            success: true,
            message: "Promo code is valid",
            promoCode: {
                code: promoCode.code,
                discountPercentage: promoCode.discountPercentage,
                maxDiscount: promoCode.maxDiscount,
                finalDiscount: Math.round(finalDiscount)
            }
        });

    } catch (error) {
        console.error("Validate promo code error:", error);
        return res.status(500).json({ error: error.message || "Failed to validate promo code" });
    }
};