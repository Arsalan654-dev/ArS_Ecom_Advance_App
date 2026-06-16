// controllers/deliveryZone.controllers.js

import DeliveryZone from '../models/deliveryZone.model.js';
import Restaurant from '../models/restaurant.model.js';

export const createDeliveryZone = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            name,
            centerLat,
            centerLon,
            radiusKm,
            deliveryChargeFlatRate,
            freeDeliveryAbove,
            estimatedTimeMinutes
        } = req.body;

        if (!name || centerLat === undefined || centerLon === undefined || !radiusKm) {
            return res.status(400).json({
                error: "Name, coordinates, and radius are required"
            });
        }

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const zone = new DeliveryZone({
            restaurant: restaurant._id,
            name,
            centerLat,
            centerLon,
            radiusKm,
            deliveryChargeFlatRate: deliveryChargeFlatRate || 0,
            freeDeliveryAbove: freeDeliveryAbove || null,
            estimatedTimeMinutes: estimatedTimeMinutes || 30
        });

        await zone.save();

        return res.status(201).json({
            success: true,
            message: "Delivery zone created successfully",
            zone
        });

    } catch (error) {
        console.error("Create delivery zone error:", error);
        return res.status(500).json({ error: error.message || "Failed to create delivery zone" });
    }
};

export const getDeliveryZones = async (req, res) => {
    try {
        const userId = req.userId;

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const zones = await DeliveryZone.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            zones
        });

    } catch (error) {
        console.error("Get delivery zones error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch delivery zones" });
    }
};

export const updateDeliveryZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const {
            name,
            centerLat,
            centerLon,
            radiusKm,
            deliveryChargeFlatRate,
            freeDeliveryAbove,
            estimatedTimeMinutes,
            isActive
        } = req.body;
        const userId = req.userId;

        const zone = await DeliveryZone.findById(zoneId).populate('restaurant');
        if (!zone) {
            return res.status(404).json({ error: "Delivery zone not found" });
        }

        if (zone.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this delivery zone" });
        }

        if (name) zone.name = name;
        if (centerLat !== undefined) zone.centerLat = centerLat;
        if (centerLon !== undefined) zone.centerLon = centerLon;
        if (radiusKm) zone.radiusKm = radiusKm;
        if (deliveryChargeFlatRate !== undefined) zone.deliveryChargeFlatRate = deliveryChargeFlatRate;
        if (freeDeliveryAbove !== undefined) zone.freeDeliveryAbove = freeDeliveryAbove;
        if (estimatedTimeMinutes) zone.estimatedTimeMinutes = estimatedTimeMinutes;
        if (isActive !== undefined) zone.isActive = isActive;

        await zone.save();

        return res.status(200).json({
            success: true,
            message: "Delivery zone updated successfully",
            zone
        });

    } catch (error) {
        console.error("Update delivery zone error:", error);
        return res.status(500).json({ error: error.message || "Failed to update delivery zone" });
    }
};

export const deleteDeliveryZone = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const userId = req.userId;

        const zone = await DeliveryZone.findById(zoneId).populate('restaurant');
        if (!zone) {
            return res.status(404).json({ error: "Delivery zone not found" });
        }

        if (zone.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this delivery zone" });
        }

        await zone.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Delivery zone deleted successfully"
        });

    } catch (error) {
        console.error("Delete delivery zone error:", error);
        return res.status(500).json({ error: error.message || "Failed to delete delivery zone" });
    }
};
