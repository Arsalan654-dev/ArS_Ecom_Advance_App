// backend/controllers/delivery.controllers.js
import Order from '../models/order.model.js';
import Delivery from '../models/delivery.model.js';
import User from '../models/user.model.js';
import { sendToUser } from '../socket.js';

// Get assigned orders for delivery boy
export const getAssignedOrders = async (req, res) => {
    try {
        const userId = req.userId;
        
        const deliveries = await Delivery.find({ 
            deliveryBoy: userId,
            status: { $ne: 'delivered' }
        })
        .populate({
            path: 'order',
            populate: [
                { path: 'restaurant', select: 'businessName phone mainAddress' },
                { path: 'customer', select: 'fullName email mobile' },
                { path: 'foodItems.foodItem', select: 'name price' }
            ]
        })
        .sort({ assignedAt: -1 });
        
        const orders = deliveries.map(d => d.order);
        
        return res.status(200).json({
            success: true,
            orders
        });
        
    } catch (error) {
        console.error("Get assigned orders error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch orders" });
    }
};

export const getDeliveryHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10, sortBy = 'deliveredAt', sortOrder = 'desc' } = req.query;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const deliveries = await Delivery.find({ 
            deliveryBoy: userId,
            status: 'delivered'
        })
        .populate({
            path: 'order',
            populate: [
                { path: 'restaurant', select: 'businessName' },
                { path: 'customer', select: 'fullName' }
            ]
        })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
        
        const total = await Delivery.countDocuments({ 
            deliveryBoy: userId,
            status: 'delivered'
        });
        
        console.log(`📦 Total deliveries: ${total}, Page: ${page}, Limit: ${limit}`);
        console.log(`📦 Total pages: ${Math.ceil(total / limit)}`);
        
        return res.status(200).json({
            success: true,
            deliveries,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error("Get delivery history error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch history" });
    }
};

// Get single order detail for delivery boy
export const getDeliveryOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;
        
        const delivery = await Delivery.findOne({ 
            order: orderId, 
            deliveryBoy: userId 
        });
        
        if (!delivery) {
            return res.status(404).json({ error: "Order not assigned to you" });
        }
        
        const order = await Order.findById(orderId)
            .populate('restaurant', 'businessName phone email mainAddress logoImage')
            .populate('customer', 'fullName email mobile')
            .populate('foodItems.foodItem', 'name price images description');
        
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        return res.status(200).json({
            success: true,
            order,
            delivery
        });
        
    } catch (error) {
        console.error("Get delivery order detail error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch order details" });
    }
};

// Update delivery status (picked_up or delivered)
export const updateDeliveryStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        const userId = req.userId;
        
        const delivery = await Delivery.findOne({ 
            order: orderId, 
            deliveryBoy: userId 
        });
        
        if (!delivery) {
            return res.status(404).json({ error: "Delivery not found" });
        }
        
        if (status === 'picked_up') {
            delivery.pickedUpAt = new Date();
            delivery.status = 'picked_up';
            await delivery.save();
            
            await Order.findByIdAndUpdate(orderId, {
                status: 'out-for-delivery',
                statusUpdatedAt: new Date()
            });
            
            // Send notification to customer that order is picked up
            const order = await Order.findById(orderId);
            if (order) {
                await sendToUser(order.customer, {
                    type: 'order_picked_up',
                    title: "Order Picked Up! 🛵",
                    message: `Your delivery partner has picked up your order. It's on the way!`,
                    data: { orderId: orderId },
                    link: `/order-tracking/${orderId}`
                }, true);
            }
            
        } else if (status === 'delivered') {
            delivery.deliveredAt = new Date();
            delivery.status = 'delivered';
            await delivery.save();
            
            const order = await Order.findByIdAndUpdate(orderId, {
                status: 'delivered',
                statusUpdatedAt: new Date()
            });
            
            // Calculate earnings (1% of order total)
            if (order) {
                const earnings = order.totalAmount * 0.01;
                delivery.earnings = earnings;
                await delivery.save();
                
                // Update delivery boy's total earnings
                const deliveryBoy = await User.findById(userId);
                if (deliveryBoy) {
                    deliveryBoy.earnings = (deliveryBoy.earnings || 0) + earnings;
                    await deliveryBoy.save();
                }
                
                // Send notification to customer
                await sendToUser(order.customer, {
                    type: 'order_delivered',
                    title: "Order Delivered! 🎉",
                    message: `Your order #${orderId.toString().slice(-8)} has been delivered. Rate your experience!`,
                    data: { orderId: orderId },
                    link: `/order-tracking/${orderId}`
                }, true);
            }
        }
        
        return res.status(200).json({
            success: true,
            message: `Order status updated to ${status}`,
            delivery
        });
        
    } catch (error) {
        console.error("Update delivery status error:", error);
        return res.status(500).json({ error: error.message || "Failed to update status" });
    }
};

// Get delivery earnings
export const getDeliveryEarnings = async (req, res) => {
    try {
        const userId = req.userId;
        
        const deliveries = await Delivery.find({ 
            deliveryBoy: userId,
            status: 'delivered'
        });
        
        const total = deliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);
        const totalDeliveries = deliveries.length;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayDeliveries = deliveries.filter(d => d.deliveredAt && d.deliveredAt >= today);
        const todayEarnings = todayDeliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);
        
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
        thisWeek.setHours(0, 0, 0, 0);
        
        const weekDeliveries = deliveries.filter(d => d.deliveredAt && d.deliveredAt >= thisWeek);
        const weekEarnings = weekDeliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);
        
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);
        
        const monthDeliveries = deliveries.filter(d => d.deliveredAt && d.deliveredAt >= thisMonth);
        const monthEarnings = monthDeliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);
        
        return res.status(200).json({
            success: true,
            total,
            today: todayEarnings,
            thisWeek: weekEarnings,
            thisMonth: monthEarnings,
            totalDeliveries
        });
        
    } catch (error) {
        console.error("Get earnings error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch earnings" });
    }
};

// Get recent deliveries for earnings page
export const getRecentDeliveries = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 5 } = req.query;
        
        const deliveries = await Delivery.find({ 
            deliveryBoy: userId,
            status: 'delivered'
        })
        .populate('order', 'totalAmount')
        .populate('restaurant', 'businessName')
        .sort({ deliveredAt: -1 })
        .limit(parseInt(limit));
        
        const formattedDeliveries = deliveries.map(d => ({
            _id: d._id,
            order: d.order,
            restaurant: d.restaurant,
            earnings: d.earnings,
            distanceKm: d.distanceKm,
            deliveredAt: d.deliveredAt
        }));
        
        return res.status(200).json({
            success: true,
            deliveries: formattedDeliveries
        });
        
    } catch (error) {
        console.error("Get recent deliveries error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch recent deliveries" });
    }
};

// Update delivery boy location
export const updateLocation = async (req, res) => {
    try {
        const userId = req.userId;
        const { latitude, longitude } = req.body;
        
        await User.findByIdAndUpdate(userId, {
            location: {
                type: 'Point',
                coordinates: [longitude, latitude]
            },
            lastLocationUpdate: new Date()
        });
        
        return res.status(200).json({
            success: true,
            message: "Location updated"
        });
        
    } catch (error) {
        console.error("Update location error:", error);
        return res.status(500).json({ error: error.message || "Failed to update location" });
    }
};



// Delete single delivery record
export const deleteDelivery = async (req, res) => {
    try {
        const { deliveryId } = req.params;
        const userId = req.userId;
        
        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
            return res.status(404).json({ error: "Delivery record not found" });
        }
        
        // Only delivery boy who owns it or admin can delete
        if (delivery.deliveryBoy.toString() !== userId) {
            const user = await User.findById(userId);
            if (user?.role !== 'admin') {
                return res.status(403).json({ error: "You don't own this delivery record" });
            }
        }
        
        await delivery.deleteOne();
        
        res.json({ success: true, message: "Delivery record deleted" });
    } catch (error) {
        console.error("Delete delivery error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete all delivery records for the delivery boy
export const deleteAllDeliveries = async (req, res) => {
    try {
        const userId = req.userId;
        
        const result = await Delivery.deleteMany({ deliveryBoy: userId });
        
        res.json({ 
            success: true, 
            message: `${result.deletedCount} delivery records deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Delete all deliveries error:", error);
        res.status(500).json({ error: error.message });
    }
};