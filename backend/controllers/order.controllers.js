// backend/controllers/order.controllers.js
import Order from '../models/order.model.js';
import Delivery from '../models/delivery.model.js';
import Restaurant from '../models/restaurant.model.js';
import User from '../models/user.model.js';
import { sendToUser } from '../socket.js';
import { findNearestDeliveryBoy, calculateDistance, assignDeliveryBoy } from '../utils/locationHelper.js';

// Notification helper function
async function sendOrderNotification(userId, order, status) {
    const notifications = {
        preparing: {
            title: "Order Being Prepared 👨‍🍳",
            message: `Your order #${order._id.toString().slice(-8)} is being prepared by the restaurant.`
        },
        ready: {
            title: "Order Ready! ✅",
            message: `Your order #${order._id.toString().slice(-8)} is ready for pickup.`
        },
        'out-for-delivery': {
            title: "Order Out for Delivery! 🚚",
            message: `Your order #${order._id.toString().slice(-8)} is out for delivery! Track your delivery boy in real-time.`
        },
        delivered: {
            title: "Order Delivered! 🎉",
            message: `Your order #${order._id.toString().slice(-8)} has been delivered. Rate your experience!`
        },
        cancelled: {
            title: "Order Cancelled ❌",
            message: `Your order #${order._id.toString().slice(-8)} has been cancelled.`
        }
    };

    const notification = notifications[status];
    if (notification) {
        await sendToUser(userId, {
            type: `order_${status}`,
            title: notification.title,
            message: notification.message,
            data: { orderId: order._id },
            link: `/order-tracking/${order._id}`
        }, true);
    }
}

// ✅ FIXED: Owner can see all orders except cancelled, but can update pending and payment_pending?
export const getRestaurantOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const { status, startDate, endDate, customerName, page = 1, limit = 20 } = req.query;

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        // ✅ FIX: Include payment_pending orders so owner can see them
        // But don't allow status update on payment_pending
        const filter = {
            restaurant: restaurant._id,
            status: { $nin: ['cancelled'] }
        };
        
        // If specific status requested, filter by that
        if (status) {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const skip = (page - 1) * limit;
        let orders = await Order.find(filter)
            .populate('customer', 'fullName email mobile')
            .populate('foodItems.foodItem', 'name price')
            .populate('delivery', 'deliveryBoy estimatedTime')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        if (customerName) {
            orders = orders.filter(order =>
                order.customer?.fullName?.toLowerCase().includes(customerName.toLowerCase())
            );
        }

        const total = await Order.countDocuments(filter);

        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit)
            }
        });

    } catch (error) {
        console.error("Get restaurant orders error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch orders" });
    }
};

export const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;

        const order = await Order.findById(orderId)
            .populate('customer', 'fullName email mobile')
            .populate('foodItems.foodItem', 'name price dietary')
            .populate('restaurant', 'businessName')
            .populate('delivery', 'deliveryBoy estimatedTime assignedAt');

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const restaurant = await Restaurant.findById(order.restaurant._id);
        if (restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this order" });
        }

        return res.status(200).json({
            success: true,
            order
        });

    } catch (error) {
        console.error("Get order detail error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch order" });
    }
};

// ✅ FIXED: Only allow status update for orders that are NOT payment_pending
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { newStatus } = req.body;
        const userId = req.userId;

        if (!newStatus) {
            return res.status(400).json({ error: "New status is required" });
        }

        const validStatuses = ['pending', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(newStatus)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        const order = await Order.findById(orderId)
            .populate('restaurant')
            .populate('delivery');

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        if (order.restaurant.owner.toString() !== userId) {
            return res.status(403).json({ error: "You don't own this order" });
        }

        // ✅ CRITICAL: Don't allow status update if order is payment_pending
        if (order.status === 'payment_pending') {
            return res.status(400).json({ 
                error: "Payment is still pending. Please wait for payment confirmation." 
            });
        }

        const validTransitions = {
            'pending': ['preparing', 'cancelled'],
            'preparing': ['ready', 'cancelled'],
            'ready': ['out-for-delivery', 'cancelled'],
            'out-for-delivery': ['delivered', 'cancelled'],
            'delivered': [],
            'cancelled': []
        };

        if (!validTransitions[order.status] || !validTransitions[order.status].includes(newStatus)) {
            return res.status(400).json({
                error: `Cannot transition from ${order.status} to ${newStatus}`
            });
        }

        const oldStatus = order.status;
        order.status = newStatus;
        order.statusUpdatedAt = new Date();

        // Send notification to customer only once
        if (oldStatus !== newStatus && newStatus !== 'cancelled') {
            await sendOrderNotification(order.customer, order, newStatus);
        }

        // Handle delivery assignment for out-for-delivery
        if (newStatus === 'out-for-delivery') {
            try {
                if (!order.delivery) {
                    const deliveryLat = order.deliveryAddress?.latitude;
                    const deliveryLng = order.deliveryAddress?.longitude;

                    console.log("📍 Delivery address coordinates:", { deliveryLat, deliveryLng });

                    if (!deliveryLat || !deliveryLng || deliveryLat === 0) {
                        return res.status(400).json({
                            error: "Order has no delivery coordinates. Please ask customer to update address."
                        });
                    }

                    let nearestBoys = [];
                    const radiusLevels = [10, 20, 50, 100];

                    for (const radius of radiusLevels) {
                        console.log(`🔍 Searching for delivery boys within ${radius}km radius...`);
                        nearestBoys = await findNearestDeliveryBoy(deliveryLat, deliveryLng, radius);
                        if (nearestBoys.length > 0) {
                            console.log(`✅ Found ${nearestBoys.length} delivery boy(s) within ${radius}km`);
                            break;
                        }
                    }

                    if (nearestBoys.length === 0) {
                        console.log("❌ No delivery boys found within 100km");
                        return res.status(400).json({
                            error: "No delivery boys available in your area. Please contact support."
                        });
                    }

                    const assignedBoy = nearestBoys[0];
                    const distance = calculateDistance(
                        deliveryLat,
                        deliveryLng,
                        assignedBoy.location.coordinates[1],
                        assignedBoy.location.coordinates[0]
                    );

                    const estimatedTime = Math.max(20, Math.ceil(distance * 3));

                    const delivery = await assignDeliveryBoy(
                        orderId,
                        assignedBoy._id,
                        order.restaurant._id,
                        estimatedTime,
                        distance
                    );

                    order.delivery = delivery._id;
                    console.log(`✅ Order ${orderId} assigned to delivery boy: ${assignedBoy.fullName} (Distance: ${distance.toFixed(2)}km, ETA: ${estimatedTime} mins)`);

                    // Send notification to delivery boy
                    await sendToUser(assignedBoy._id, {
                        type: 'delivery_assigned',
                        title: "New Delivery Assignment! 🛵",
                        message: `Order #${order._id.toString().slice(-8)} has been assigned to you.`,
                        data: { orderId: order._id },
                        link: `/delivery/orders/${order._id}`
                    }, true);
                }
            } catch (error) {
                console.error("❌ Error assigning delivery boy:", error);
                return res.status(500).json({
                    error: "Failed to assign delivery boy. Please try again.",
                    details: error.message
                });
            }
        }

        await order.save();

        const updatedOrder = await Order.findById(orderId)
            .populate('customer', 'fullName email')
            .populate('foodItems.foodItem', 'name price')
            .populate('delivery', 'deliveryBoy estimatedTime');

        return res.status(200).json({
            success: true,
            message: `Order status updated to ${newStatus}`,
            order: updatedOrder
        });

    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({ error: error.message || "Failed to update order status" });
    }
};

export const getOrderStats = async (req, res) => {
    try {
        const userId = req.userId;
        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = await Order.countDocuments({
            restaurant: restaurant._id,
            createdAt: { $gte: today },
            status: { $nin: ['payment_pending', 'cancelled'] }
        });

        const pendingOrders = await Order.countDocuments({
            restaurant: restaurant._id,
            status: 'pending'
        });

        const todayRevenue = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurant._id,
                    createdAt: { $gte: today },
                    status: { $nin: ['payment_pending', 'cancelled'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        const ratings = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurant._id,
                    ratedByCustomer: true
                }
            },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$ratings' }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                todayOrders,
                pendingOrders,
                todayRevenue: todayRevenue[0]?.total || 0,
                averageRating: ratings[0]?.avgRating || 0
            }
        });

    } catch (error) {
        console.error("Get order stats error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch stats" });
    }
};