// backend/controllers/admin.controllers.js
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Restaurant from '../models/restaurant.model.js';
import WebhookEvent from '../models/WebhookEvent.model.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Get dashboard statistics
export const getAdminStats = async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.setHours(0, 0, 0, 0));
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        // Orders stats
        const totalOrders = await Order.countDocuments();
        const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
        const monthOrders = await Order.countDocuments({ createdAt: { $gte: thisMonth } });
        
        // Revenue stats
        const revenueStats = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalAmount' },
                    platformFees: { $sum: '$platformFee' },
                    restaurantPayouts: { $sum: '$restaurantEarnings' },
                    deliveryPayouts: { $sum: '$deliveryEarnings' }
                }
            }
        ]);
        
        // User stats
        const totalUsers = await User.countDocuments();
        const totalRestaurants = await Restaurant.countDocuments({ status: 'approved' });
        const totalDeliveryBoys = await User.countDocuments({ role: 'deliveryBoy' });
        
        // Webhook stats
        const webhookStats = await WebhookEvent.aggregate([
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    lastReceived: { $max: '$createdAt' }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Recent webhook events
        const recentWebhooks = await WebhookEvent.find()
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Stripe balance
        let stripeBalance = null;
        try {
            const balance = await stripe.balance.retrieve();
            stripeBalance = {
                available: balance.available[0]?.amount / 100 || 0,
                pending: balance.pending[0]?.amount / 100 || 0,
                currency: balance.available[0]?.currency || 'pkr'
            };
        } catch (err) {
            console.log("Could not fetch Stripe balance");
        }
        
        res.json({
            success: true,
            stats: {
                orders: {
                    total: totalOrders,
                    today: todayOrders,
                    thisMonth: monthOrders
                },
                revenue: revenueStats[0] || {
                    totalRevenue: 0,
                    platformFees: 0,
                    restaurantPayouts: 0,
                    deliveryPayouts: 0
                },
                users: {
                    total: totalUsers,
                    restaurants: totalRestaurants,
                    deliveryBoys: totalDeliveryBoys
                },
                webhookStats,
                stripeBalance
            },
            recentWebhooks
        });
        
    } catch (error) {
        console.error("Get admin stats error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all webhook events
export const getWebhookEvents = async (req, res) => {
    try {
        const { page = 1, limit = 20, eventType, processed } = req.query;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (eventType) filter.eventType = eventType;
        if (processed !== undefined) filter.processed = processed === 'true';
        
        const events = await WebhookEvent.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await WebhookEvent.countDocuments(filter);
        
        res.json({
            success: true,
            events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error("Get webhook events error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get single webhook event
export const getWebhookEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await WebhookEvent.findById(id);
        
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        res.json({ success: true, event });
        
    } catch (error) {
        console.error("Get webhook event error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Reprocess webhook event
export const reprocessWebhook = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await WebhookEvent.findById(id);
        
        if (!event) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        // Reprocess based on event type
        switch (event.eventType) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object);
                break;
            // Add other cases
            default:
                console.log(`Cannot reprocess event type: ${event.eventType}`);
        }
        
        event.processed = true;
        event.processedAt = new Date();
        await event.save();
        
        res.json({ success: true, message: "Event reprocessed successfully" });
        
    } catch (error) {
        console.error("Reprocess webhook error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all transactions
export const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, status } = req.query;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (type) filter.paymentMethod = type;
        if (status) filter.paymentStatus = status;
        
        const transactions = await Order.find(filter)
            .populate('customer', 'fullName email')
            .populate('restaurant', 'businessName')
            .populate('delivery.deliveryBoy', 'fullName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Order.countDocuments(filter);
        
        res.json({
            success: true,
            transactions,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            }
        });
        
    } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get platform earnings
export const getPlatformEarnings = async (req, res) => {
    try {
        const { period = 'daily' } = req.query;
        
        let groupBy;
        let dateFormat;
        
        if (period === 'daily') {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
                day: { $dayOfMonth: '$createdAt' }
            };
            dateFormat = '%Y-%m-%d';
        } else if (period === 'monthly') {
            groupBy = {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
            };
            dateFormat = '%Y-%m';
        } else {
            groupBy = {
                year: { $year: '$createdAt' }
            };
            dateFormat = '%Y';
        }
        
        const earnings = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    status: 'delivered'
                }
            },
            {
                $group: {
                    _id: groupBy,
                    platformFee: { $sum: '$platformFee' },
                    totalRevenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
        ]);
        
        res.json({
            success: true,
            period,
            earnings
        });
        
    } catch (error) {
        console.error("Get platform earnings error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get stripe account details
export const getStripeAccount = async (req, res) => {
    try {
        const stripeAccount = await stripe.accounts.retrieve();
        
        res.json({
            success: true,
            account: {
                id: stripeAccount.id,
                email: stripeAccount.email,
                country: stripeAccount.country,
                defaultCurrency: stripeAccount.default_currency,
                chargesEnabled: stripeAccount.charges_enabled,
                payoutsEnabled: stripeAccount.payouts_enabled,
                detailsSubmitted: stripeAccount.details_submitted
            }
        });
        
    } catch (error) {
        console.error("Get stripe account error:", error);
        res.status(500).json({ error: error.message });
    }
};