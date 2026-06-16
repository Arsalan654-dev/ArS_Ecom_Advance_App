// backend/controllers/location.controllers.js
import Delivery from '../models/delivery.model.js';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';

// Update delivery boy's current location
export const updateLocation = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId, latitude, longitude, accuracy, speed } = req.body;
        
        if (!latitude || !longitude) {
            return res.status(400).json({ error: "Latitude and longitude are required" });
        }
        
        // Find active delivery for this delivery boy
        const delivery = await Delivery.findOne({
            deliveryBoy: userId,
            status: { $ne: 'delivered' }
        });
        
        if (!delivery) {
            return res.status(404).json({ error: "No active delivery found" });
        }
        
        // Update current location
        delivery.currentLocation = {
            type: 'Point',
            coordinates: [longitude, latitude],
            lastUpdate: new Date()
        };
        
        // Add to location history
        delivery.locationHistory.push({
            coordinates: [longitude, latitude],
            timestamp: new Date(),
            accuracy: accuracy || 0,
            speed: speed || 0
        });
        
        // Keep only last 100 locations (避免数据库过大)
        if (delivery.locationHistory.length > 100) {
            delivery.locationHistory = delivery.locationHistory.slice(-100);
        }
        
        await delivery.save();
        
        // Also update user's location for future assignments
        await User.findByIdAndUpdate(userId, {
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            lastLocationUpdate: new Date()
        });
        
        return res.status(200).json({
            success: true,
            message: "Location updated",
            location: delivery.currentLocation
        });
        
    } catch (error) {
        console.error("Update location error:", error);
        return res.status(500).json({ error: error.message || "Failed to update location" });
    }
};

// Get delivery boy's current location for customer
export const getDeliveryLocation = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;
        
        // Verify order belongs to this customer
        const order = await Order.findOne({ _id: orderId, customer: userId });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        // Get delivery details
        const delivery = await Delivery.findOne({ order: orderId })
            .populate('deliveryBoy', 'fullName phone avatar');
        
        if (!delivery) {
            return res.status(404).json({ error: "Delivery not assigned yet" });
        }
        
        // Calculate ETA if we have location history
        let eta = delivery.estimatedTime;
        let remainingDistance = null;
        
        if (delivery.locationHistory.length > 0) {
            const lastLocation = delivery.locationHistory[delivery.locationHistory.length - 1];
            const deliveryAddress = order.deliveryAddress;
            
            if (deliveryAddress && deliveryAddress.latitude && deliveryAddress.longitude) {
                remainingDistance = calculateDistance(
                    lastLocation.coordinates[1],
                    lastLocation.coordinates[0],
                    deliveryAddress.latitude,
                    deliveryAddress.longitude
                );
                
                // Calculate ETA based on remaining distance (assuming 30km/h average speed)
                const avgSpeed = 30; // km/h
                const etaMinutes = Math.ceil((remainingDistance / avgSpeed) * 60);
                eta = Math.max(5, etaMinutes);
            }
        }
        
        return res.status(200).json({
            success: true,
            location: delivery.currentLocation,
            locationHistory: delivery.locationHistory.slice(-20), // Last 20 locations
            deliveryBoy: {
                name: delivery.deliveryBoy.fullName,
                phone: delivery.deliveryBoy.phone,
                avatar: delivery.deliveryBoy.avatar
            },
            eta,
            remainingDistance,
            status: delivery.status,
            pickedUpAt: delivery.pickedUpAt,
            estimatedTime: delivery.estimatedTime
        });
        
    } catch (error) {
        console.error("Get delivery location error:", error);
        return res.status(500).json({ error: error.message || "Failed to get location" });
    }
};

// Get location history for delivery boy (for analytics)
export const getLocationHistory = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;
        
        // Verify delivery boy owns this delivery
        const delivery = await Delivery.findOne({ 
            order: orderId, 
            deliveryBoy: userId 
        });
        
        if (!delivery) {
            return res.status(404).json({ error: "Delivery not found" });
        }
        
        return res.status(200).json({
            success: true,
            locationHistory: delivery.locationHistory,
            route: delivery.locationHistory.map(loc => ({
                lat: loc.coordinates[1],
                lng: loc.coordinates[0],
                time: loc.timestamp
            }))
        });
        
    } catch (error) {
        console.error("Get location history error:", error);
        return res.status(500).json({ error: error.message || "Failed to get history" });
    }
};

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}