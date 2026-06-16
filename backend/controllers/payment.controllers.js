// backend/controllers/payment.controllers.js
import Stripe from 'stripe';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';

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

// Confirm payment (webhook will handle)
export const confirmPayment = async (req, res) => {
    try {
        const { paymentIntentId } = req.body;
        
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status === 'succeeded') {
            // Update order
            const order = await Order.findOne({ paymentIntentId });
            if (order) {
                order.paymentStatus = 'paid';
                order.paymentMethod = 'online';
                await order.save();
            }
        }
        
        return res.status(200).json({
            success: true,
            status: paymentIntent.status
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
        const restaurant = await order.restaurant;
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