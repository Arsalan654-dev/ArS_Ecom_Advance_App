// controllers/metrics.controllers.js

import Order from '../models/order.model.js';
import Restaurant from '../models/restaurant.model.js';

export const getDashboardMetrics = async (req, res) => {
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
            status: { $ne: 'cancelled' }
        });

        const pendingOrders = await Order.countDocuments({
            restaurant: restaurant._id,
            status: 'pending'
        });

        const todayRevenueData = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurant._id,
                    createdAt: { $gte: today },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' }
                }
            }
        ]);

        const ratingsData = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurant._id,
                    ratedByCustomer: true,
                    ratings: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$ratings' },
                    totalRatings: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            metrics: {
                todayOrders,
                pendingOrders,
                todayRevenue: todayRevenueData[0]?.total || 0,
                averageRating: ratingsData[0]?.avgRating?.toFixed(1) || 0,
                totalRatings: ratingsData[0]?.totalRatings || 0
            }
        });

    } catch (error) {
        console.error("Get dashboard metrics error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch metrics" });
    }
};

export const getEarningsReport = async (req, res) => {
    try {
        const userId = req.userId;
        const { period = 'daily', month, year } = req.query;

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        let startDate, endDate;
        let groupBy;

        if (period === 'daily') {
            const selectedDate = month && year
                ? new Date(year, parseInt(month) - 1, 1)
                : new Date();

            startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);

            groupBy = {
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            };
        } else {
            const selectedYear = year || new Date().getFullYear();
            startDate = new Date(selectedYear, 0, 1);
            endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

            groupBy = {
                $dateToString: { format: '%Y-%m', date: '$createdAt' }
            };
        }

        const earningsData = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurant._id,
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: groupBy,
                    revenue: { $sum: '$totalAmount' },
                    discount: { $sum: '$discountApplied' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const totalEarnings = await Order.aggregate([
            {
                $match: {
                    restaurant: restaurant._id,
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: { $ne: 'cancelled' }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalAmount' },
                    totalDiscount: { $sum: '$discountApplied' },
                    orderCount: { $sum: 1 }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            period,
            data: earningsData,
            summary: {
                totalEarnings: totalEarnings[0]?.total || 0,
                totalDiscount: totalEarnings[0]?.totalDiscount || 0,
                orderCount: totalEarnings[0]?.orderCount || 0,
                averageOrderValue: totalEarnings[0]
                    ? (totalEarnings[0].total / totalEarnings[0].orderCount).toFixed(2)
                    : 0
            }
        });

    } catch (error) {
        console.error("Get earnings report error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch earnings report" });
    }
};

export const getSentimentAnalysis = async (req, res) => {
    try {
        const userId = req.userId;

        const restaurant = await Restaurant.findOne({ owner: userId });
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        const ratedOrders = await Order.find({
            restaurant: restaurant._id,
            ratedByCustomer: true
        }).sort({ createdAt: -1 });

        const sentimentCounts = {
            positive: 0,
            neutral: 0,
            negative: 0
        };

        const allReviews = [];

        for (const order of ratedOrders) {
            if (order.ratings >= 4) sentimentCounts.positive++;
            else if (order.ratings === 3) sentimentCounts.neutral++;
            else sentimentCounts.negative++;

            if (order.review) {
                allReviews.push({
                    rating: order.ratings,
                    review: order.review,
                    customer: order.customer,
                    createdAt: order.createdAt
                });
            }
        }

        const total = ratedOrders.length;

        const topPositive = allReviews
            .filter(r => r.rating >= 4)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        const topNegative = allReviews
            .filter(r => r.rating <= 2)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);

        return res.status(200).json({
            success: true,
            sentiment: {
                positive: total > 0 ? ((sentimentCounts.positive / total) * 100).toFixed(1) : 0,
                neutral: total > 0 ? ((sentimentCounts.neutral / total) * 100).toFixed(1) : 0,
                negative: total > 0 ? ((sentimentCounts.negative / total) * 100).toFixed(1) : 0,
                totalReviews: total
            },
            topPositiveReviews: topPositive,
            topNegativeReviews: topNegative
        });

    } catch (error) {
        console.error("Get sentiment analysis error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch sentiment analysis" });
    }
};
