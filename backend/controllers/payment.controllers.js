// backend/controllers/payment.controllers.js
import Stripe from 'stripe';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Restaurant from '../models/restaurant.model.js';
import { sendToUser } from '../socket.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent
export const createPaymentIntent = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.userId;
        
        const order = await Order.findOne({ _id: orderId, customer: userId });
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(order.totalAmount * 100), // Convert to cents/paisa
            currency: 'pkr',
            metadata: {
                orderId: order._id.toString(),
                userId: userId.toString()
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        
        // Save payment intent ID to order
        order.paymentIntentId = paymentIntent.id;
        await order.save();
        
        return res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
            publishableKey: process.env.STRIPE_PUBLIC_KEY
        });
        
    } catch (error) {
        console.error("Create payment intent error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Confirm payment - called from frontend after successful Stripe payment
export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId, orderId } = req.body;
        const userId = req.userId;

        let order = null;

        // Try to find order by paymentIntentId
        if (paymentIntentId) {
            order = await Order.findOne({ paymentIntentId });
        }

        // Fallback: find by orderId
        if (!order && orderId) {
            order = await Order.findOne({ _id: orderId, customer: userId });
        }

        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        // Verify payment with Stripe
        if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            
            if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'processing') {
                return res.status(400).json({
                    success: false,
                    error: `Payment not successful. Status: ${paymentIntent.status}`
                });
            }
        }

        // Only update if currently payment_pending
        if (order.status === 'payment_pending') {
            order.status = 'pending';
            order.paymentStatus = 'paid';
            order.paymentMethod = 'online';
            order.paidAt = new Date();
            await order.save();

            // Distribute earnings
            await distributeEarnings(order);

            // Clear cart
            try {
                const { default: Cart } = await import('../models/cart.model.js');
                await Cart.findOneAndUpdate({ user: userId }, { items: [] });
            } catch (_) {}

            // Send notification to customer
            await sendToUser(order.customer, {
                type: 'order_placed',
                title: "Payment Successful! ✅",
                message: `Your order #${order._id.toString().slice(-8)} has been placed successfully.`,
                data: { orderId: order._id },
                link: `/order-tracking/${order._id}`
            }, true);

            // Send notification to restaurant owner
            try {
                const restaurant = await Restaurant.findById(order.restaurant);
                if (restaurant?.owner) {
                    await sendToUser(restaurant.owner, {
                        type: 'new_order',
                        title: "New Order Received! 🎉",
                        message: `A new order #${order._id.toString().slice(-8)} has been placed at your restaurant.`,
                        data: { orderId: order._id },
                        link: `/owner/orders/${order._id}`
                    }, true);
                }
            } catch (_) {}
        }

        return res.status(200).json({
            success: true,
            message: "Payment confirmed successfully",
            order: {
                _id: order._id,
                status: order.status,
                paymentStatus: order.paymentStatus
            }
        });
        
    } catch (error) {
        console.error("Confirm payment error:", error);
        return res.status(500).json({ error: error.message });
    }
};

// Stripe Webhook
export const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
            
            // Update order
            const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
            if (order) {
                order.paymentStatus = 'paid';
                order.paymentMethod = 'online';
                await order.save();
                
                // Calculate and distribute earnings
                await distributeEarnings(order);
            }
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
};

// Distribute earnings to restaurant owner and delivery boy
async function distributeEarnings(order) {
    try {
        // Get restaurant owner
        const { default: RestaurantModel } = await import('../models/restaurant.model.js');
        const restaurant = await RestaurantModel.findById(order.restaurant);
        if (!restaurant) {
            console.log(`Restaurant not found: ${order.restaurant}`);
            return;
        }
        const owner = await User.findById(restaurant.owner);
        
        // Calculate commissions
        const platformFee = order.totalAmount * 0.10; // 10% platform fee
        const restaurantEarnings = order.totalAmount * 0.85; // 85% to restaurant
        const deliveryEarnings = order.totalAmount * 0.05; // 5% to delivery boy
        
        // Store earnings in order
        order.restaurantEarnings = restaurantEarnings;
        order.deliveryEarnings = deliveryEarnings;
        order.platformFee = platformFee;
        await order.save();
        
        // Update restaurant owner's balance
        if (owner) {
            owner.balance = (owner.balance || 0) + restaurantEarnings;
            await owner.save();
        }
        
        // Update delivery boy's earnings
        if (order.delivery) {
            const deliveryBoy = await User.findById(order.delivery.deliveryBoy);
            if (deliveryBoy) {
                deliveryBoy.earnings = (deliveryBoy.earnings || 0) + deliveryEarnings;
                await deliveryBoy.save();
            }
        }
        
        console.log(`Earnings distributed for order ${order._id}`);
    } catch (error) {
        console.error("Error distributing earnings:", error);
    }
}