// backend/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Restaurant from '../models/restaurant.model.js';

export const verifyToken = async (req, res, next) => {
    try {
        // Get token from cookie or Authorization header
        let token = req.cookies?.token;

        if (!token && req.headers.authorization) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ error: "Access denied. No token provided." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();

    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};

export const requireRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.userId);
            if (!user || !allowedRoles.includes(user.role)) {
                return res.status(403).json({ error: "Insufficient permissions" });
            }
            req.user = user;
            req.ownerRestaurant = user.restaurantId;
            next();
        } catch (error) {
            console.error("Role verification error:", error);
            return res.status(500).json({ error: "Authorization failed" });
        }
    };
};

export const verifyRestaurantOwnership = async (req, res, next) => {
    try {
        const restaurantId = req.params.restaurantId || req.body.restaurantId;

        if (!restaurantId) {
            return res.status(400).json({ error: "Restaurant ID is required" });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant || restaurant.owner.toString() !== req.userId) {
            return res.status(403).json({ error: "You don't own this restaurant" });
        }

        req.restaurant = restaurant;
        next();
    } catch (error) {
        console.error("Ownership verification error:", error);
        return res.status(500).json({ error: "Ownership verification failed" });
    }
};
