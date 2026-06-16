// backend/controllers/connect.controllers.js
import Stripe from 'stripe';
import User from '../models/user.model.js';
import Order from '../models/order.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create or get Stripe Connect account for user
export const createConnectAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Check if user already has a Stripe account
        if (user.stripeAccountId) {
            // Create account link to login/dashboard
            const accountLink = await stripe.accountLinks.create({
                account: user.stripeAccountId,
                refresh_url: `${process.env.FRONTEND_URL}/payment-settings?refresh=true`,
                return_url: `${process.env.FRONTEND_URL}/payment-settings?success=true`,
                type: 'account_onboarding',
            });
            
            return res.json({ 
                success: true, 
                url: accountLink.url,
                hasAccount: true 
            });
        }
        
        // Create new Stripe Connect account
        const account = await stripe.accounts.create({
            type: 'express',
            country: 'PK',
            email: user.email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            business_type: user.role === 'owner' ? 'company' : 'individual',
            business_profile: {
                name: user.role === 'owner' ? user.businessName : user.fullName,
                url: process.env.FRONTEND_URL,
            },
        });
        
        // Save account ID to user
        user.stripeAccountId = account.id;
        await user.save();
        
        // Create account link for onboarding
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${process.env.FRONTEND_URL}/payment-settings?refresh=true`,
            return_url: `${process.env.FRONTEND_URL}/payment-settings?success=true`,
            type: 'account_onboarding',
        });
        
        return res.json({ 
            success: true, 
            url: accountLink.url,
            hasAccount: false 
        });
        
    } catch (error) {
        console.error("Create connect account error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Get account status
export const getAccountStatus = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user || !user.stripeAccountId) {
            return res.json({ 
                hasAccount: false,
                isEnabled: false,
                detailsSubmitted: false,
                payoutsEnabled: false 
            });
        }
        
        const account = await stripe.accounts.retrieve(user.stripeAccountId);
        
        return res.json({
            hasAccount: true,
            isEnabled: account.charges_enabled,
            detailsSubmitted: account.details_submitted,
            payoutsEnabled: account.payouts_enabled,
            payoutsSchedule: account.settings?.payouts?.schedule,
            defaultCurrency: account.default_currency,
            capabilities: account.capabilities
        });
        
    } catch (error) {
        console.error("Get account status error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Get balance for user
export const getBalance = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Get total earnings
        let totalEarnings = 0;
        let pendingBalance = 0;
        
        if (user.role === 'owner') {
            // Get all completed orders for restaurant
            const orders = await Order.find({ 
                restaurant: user.restaurantId,
                paymentStatus: 'paid',
                status: 'delivered'
            });
            totalEarnings = orders.reduce((sum, order) => sum + (order.restaurantEarnings || 0), 0);
            pendingBalance = user.balance || 0;
        } else if (user.role === 'deliveryBoy') {
            // Get all completed deliveries
            const deliveries = await Order.find({ 
                'delivery.deliveryBoy': userId,
                status: 'delivered'
            });
            totalEarnings = deliveries.reduce((sum, order) => sum + (order.deliveryEarnings || 0), 0);
            pendingBalance = user.earnings || 0;
        }
        
        // Get Stripe balance if account exists
        let stripeBalance = null;
        if (user.stripeAccountId) {
            try {
                const balance = await stripe.balance.retrieve({
                    stripeAccount: user.stripeAccountId
                });
                stripeBalance = {
                    available: balance.available[0]?.amount / 100 || 0,
                    pending: balance.pending[0]?.amount / 100 || 0
                };
            } catch (err) {
                console.log("Could not fetch Stripe balance");
            }
        }
        
        return res.json({
            success: true,
            totalEarnings,
            pendingBalance,
            stripeBalance,
            currency: 'pkr'
        });
        
    } catch (error) {
        console.error("Get balance error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Request payout
export const requestPayout = async (req, res) => {
    try {
        const userId = req.userId;
        const { amount } = req.body;
        const user = await User.findById(userId);
        
        if (!user || !user.stripeAccountId) {
            return res.status(400).json({ error: "No Stripe account connected" });
        }
        
        // Check if user has sufficient balance
        let availableBalance = 0;
        if (user.role === 'owner') {
            availableBalance = user.balance || 0;
        } else {
            availableBalance = user.earnings || 0;
        }
        
        if (amount > availableBalance) {
            return res.status(400).json({ error: "Insufficient balance" });
        }
        
        // Create payout to connected account
        const payout = await stripe.payouts.create(
            {
                amount: Math.round(amount * 100),
                currency: 'pkr',
            },
            {
                stripeAccount: user.stripeAccountId,
            }
        );
        
        // Update user balance
        if (user.role === 'owner') {
            user.balance = (user.balance || 0) - amount;
        } else {
            user.earnings = (user.earnings || 0) - amount;
        }
        await user.save();
        
        // Record payout transaction
        const transaction = {
            amount,
            status: payout.status,
            stripePayoutId: payout.id,
            createdAt: new Date()
        };
        
        user.payoutHistory = user.payoutHistory || [];
        user.payoutHistory.push(transaction);
        await user.save();
        
        return res.json({
            success: true,
            message: "Payout requested successfully",
            payout,
            newBalance: availableBalance - amount
        });
        
    } catch (error) {
        console.error("Payout error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Get payout history
export const getPayoutHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        return res.json({
            success: true,
            history: user.payoutHistory || []
        });
        
    } catch (error) {
        console.error("Get payout history error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Disconnect Stripe account
export const disconnectAccount = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        
        if (!user || !user.stripeAccountId) {
            return res.status(400).json({ error: "No Stripe account connected" });
        }
        
        // Delete the Stripe account
        await stripe.accounts.del(user.stripeAccountId);
        
        user.stripeAccountId = null;
        await user.save();
        
        return res.json({
            success: true,
            message: "Stripe account disconnected successfully"
        });
        
    } catch (error) {
        console.error("Disconnect account error:", error);
        return res.status(500).json({ error: error.message });
    }
};