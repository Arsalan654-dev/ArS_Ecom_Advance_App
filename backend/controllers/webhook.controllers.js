// backend/controllers/webhook.controllers.js
import Stripe from 'stripe';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Restaurant from '../models/restaurant.model.js';
import Delivery from '../models/delivery.model.js';
import WebhookEvent from '../models/WebhookEvent.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Idempotency set
const processedEvents = new Set();

// Save webhook event to database
async function saveWebhookEvent(event) {
    try {
        const webhookEvent = new WebhookEvent({
            eventId: event.id,
            eventType: event.type,
            apiVersion: event.api_version,
            created: new Date(event.created * 1000),
            data: event.data,
            processed: false
        });
        await webhookEvent.save();
        console.log(`📝 Webhook event saved: ${event.id}`);
    } catch (error) {
        console.error('Error saving webhook event:', error);
    }
}
// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent) {
    try {
        console.log(`💰 Payment succeeded: ${paymentIntent.id}`);
        console.log(`📦 Metadata:`, paymentIntent.metadata);
        
        const orderIdFromMetadata = paymentIntent.metadata?.orderId;
        const userIdFromMetadata = paymentIntent.metadata?.userId;
        
        let order = null;
        
        // Method 1: Find by paymentIntentId
        order = await Order.findOne({ paymentIntentId: paymentIntent.id });
        if (order) console.log(`✅ Found by paymentIntentId: ${order._id}`);
        
        // Method 2: Find by metadata.orderId
        if (!order && orderIdFromMetadata) {
            order = await Order.findById(orderIdFromMetadata);
            if (order) console.log(`✅ Found by metadata.orderId: ${order._id}`);
        }
        
        // Method 3: Find by userId (latest payment_pending order)
        if (!order && userIdFromMetadata) {
            order = await Order.findOne({ 
                customer: userIdFromMetadata, 
                status: 'payment_pending' 
            }).sort({ createdAt: -1 });
            if (order) console.log(`✅ Found by userId: ${order._id}`);
        }
        
        // Method 4: Find any recent payment_pending order (last 10 minutes)
        if (!order) {
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            order = await Order.findOne({ 
                status: 'payment_pending',
                createdAt: { $gt: tenMinutesAgo }
            }).sort({ createdAt: -1 });
            if (order) console.log(`✅ Found by recent search: ${order._id}`);
        }
        
        if (!order) {
            console.log(`❌ No order found for payment intent: ${paymentIntent.id}`);
            return;
        }
        
        console.log(`📦 Order: ${order._id}, current status: ${order.status}`);
        
        if (order.status === 'payment_pending') {
            order.status = 'pending';
            order.paymentStatus = 'paid';
            order.paidAt = new Date();
            await order.save();
            console.log(`✅ Order ${order._id} updated to pending!`);
        }
        
        // Clear cart
        if (paymentIntent.metadata?.cartId) {
            try {
                const { default: Cart } = await import('../models/cart.model.js');
                await Cart.findByIdAndUpdate(paymentIntent.metadata.cartId, { items: [] });
                console.log(`✅ Cart cleared: ${paymentIntent.metadata.cartId}`);
            } catch (err) {
                console.log("Cart clear error:", err.message);
            }
        }
        
        // Send notifications
        try {
            const { sendToUser } = await import('../socket.js');
            
            await sendToUser(order.customer, {
                type: 'order_placed',
                title: "Payment Successful! 🎉",
                message: `Your payment has been received. Order #${order._id.toString().slice(-8)} is confirmed.`,
                data: { orderId: order._id },
                link: `/order-tracking/${order._id}`
            }, true);
            
            const restaurant = await Restaurant.findById(order.restaurant);
            if (restaurant?.owner) {
                await sendToUser(restaurant.owner, {
                    type: 'new_order',
                    title: "New Order Received! 🆕",
                    message: `New order #${order._id.toString().slice(-8)} - Payment confirmed`,
                    data: { orderId: order._id },
                    link: `/owner/orders/${order._id}`
                }, true);
            }
        } catch (notifError) {
            console.error("Notification error:", notifError);
        }
        
        console.log(`✅ Webhook completed for order ${order._id}`);
        
    } catch (error) {
        console.error('Error in webhook:', error);
    }
}
// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent) {
    try {
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        
        const order = await Order.findOne({ paymentIntentId: paymentIntent.id });
        
        if (order && order.status === 'payment_pending') {
            order.paymentStatus = 'failed';
            order.status = 'cancelled';
            await order.save();
            console.log(`Order ${order._id} marked as payment failed and cancelled`);
        }
        
    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
}

// Handle refund
async function handleChargeRefunded(charge) {
    try {
        console.log(`🔄 Refund processed: ${charge.id}`);
        
        const order = await Order.findOne({ paymentIntentId: charge.payment_intent });
        
        if (order) {
            order.paymentStatus = 'refunded';
            order.status = 'cancelled';
            order.refundedAt = new Date();
            await order.save();
            console.log(`Order ${order._id} marked as refunded and cancelled`);
        }
        
    } catch (error) {
        console.error('Error handling refund:', error);
    }
}

// Handle Stripe Connect account update
async function handleAccountUpdated(account) {
    try {
        console.log(`🔄 Stripe account updated: ${account.id}`);
        
        const user = await User.findOne({ stripeAccountId: account.id });
        
        if (user) {
            user.stripeAccountStatus = {
                chargesEnabled: account.charges_enabled,
                payoutsEnabled: account.payouts_enabled,
                detailsSubmitted: account.details_submitted,
                updatedAt: new Date()
            };
            await user.save();
            console.log(`✅ Updated account status for user: ${user.email}`);
        }
        
    } catch (error) {
        console.error('Error handling account update:', error);
    }
}

// Handle successful payout to connected account
async function handlePayoutPaid(payout) {
    try {
        console.log(`💸 Payout paid: ${payout.id}`);
        
        const user = await User.findOne({ stripeAccountId: payout.destination });
        
        if (user && user.payoutHistory) {
            const payoutRecord = user.payoutHistory.find(p => p.stripePayoutId === payout.id);
            if (payoutRecord) {
                payoutRecord.status = 'paid';
                payoutRecord.paidAt = new Date();
                await user.save();
            }
            console.log(`✅ Payout paid to user: ${user.email}`);
        }
        
    } catch (error) {
        console.error('Error handling payout paid:', error);
    }
}

// Handle failed payout
async function handlePayoutFailed(payout) {
    try {
        console.log(`❌ Payout failed: ${payout.id}`);
        
        const user = await User.findOne({ stripeAccountId: payout.destination });
        
        if (user && user.payoutHistory) {
            const payoutRecord = user.payoutHistory.find(p => p.stripePayoutId === payout.id);
            if (payoutRecord) {
                payoutRecord.status = 'failed';
                payoutRecord.failureMessage = payout.failure_message;
                await user.save();
                
                if (user.role === 'owner') {
                    user.balance = (user.balance || 0) + payoutRecord.amount;
                } else {
                    user.earnings = (user.earnings || 0) + payoutRecord.amount;
                }
                await user.save();
            }
        }
        
    } catch (error) {
        console.error('Error handling payout failed:', error);
    }
}

// Handle transfer creation
async function handleTransferCreated(transfer) {
    try {
        console.log(`📦 Transfer created: ${transfer.id}`);
    } catch (error) {
        console.error('Error handling transfer created:', error);
    }
}

// Handle transfer paid
async function handleTransferPaid(transfer) {
    try {
        console.log(`✅ Transfer paid: ${transfer.id}`);
        
        const order = await Order.findOne({ transferId: transfer.id });
        if (order) {
            order.transferStatus = 'paid';
            await order.save();
        }
        
    } catch (error) {
        console.error('Error handling transfer paid:', error);
    }
}

// Distribute earnings function
async function distributeEarnings(order) {
    try {
        const restaurant = await Restaurant.findById(order.restaurant);
        if (!restaurant) {
            console.log(`Restaurant not found: ${order.restaurant}`);
            return;
        }
        
        const owner = await User.findById(restaurant.owner);
        
        const platformFee = order.totalAmount * 0.10;
        const restaurantEarnings = order.totalAmount * 0.85;
        const deliveryEarnings = order.totalAmount * 0.05;
        
        order.restaurantEarnings = restaurantEarnings;
        order.deliveryEarnings = deliveryEarnings;
        order.platformFee = platformFee;
        await order.save();
        
        if (owner && owner.stripeAccountId && owner.stripeAccountStatus?.payoutsEnabled) {
            try {
                const transfer = await stripe.transfers.create({
                    amount: Math.round(restaurantEarnings * 100),
                    currency: 'pkr',
                    destination: owner.stripeAccountId,
                    transfer_group: order._id.toString(),
                    metadata: {
                        orderId: order._id.toString(),
                        type: 'restaurant_earnings'
                    }
                });
                order.transferId = transfer.id;
                await order.save();
                console.log(`✅ Transferred ₨ ${restaurantEarnings} to restaurant owner ${owner.email}`);
            } catch (err) {
                console.error(`Failed to transfer: ${err.message}`);
                owner.balance = (owner.balance || 0) + restaurantEarnings;
                await owner.save();
            }
        } else if (owner) {
            owner.balance = (owner.balance || 0) + restaurantEarnings;
            await owner.save();
            console.log(`Added ₨ ${restaurantEarnings} to owner balance`);
        }
        
        if (order.delivery) {
            const deliveryBoy = await User.findById(order.delivery.deliveryBoy);
            if (deliveryBoy && deliveryBoy.stripeAccountId && deliveryBoy.stripeAccountStatus?.payoutsEnabled) {
                try {
                    await stripe.transfers.create({
                        amount: Math.round(deliveryEarnings * 100),
                        currency: 'pkr',
                        destination: deliveryBoy.stripeAccountId,
                        transfer_group: order._id.toString(),
                        metadata: {
                            orderId: order._id.toString(),
                            type: 'delivery_earnings'
                        }
                    });
                    console.log(`✅ Transferred ₨ ${deliveryEarnings} to delivery boy ${deliveryBoy.email}`);
                } catch (err) {
                    console.error(`Failed to transfer: ${err.message}`);
                    deliveryBoy.earnings = (deliveryBoy.earnings || 0) + deliveryEarnings;
                    await deliveryBoy.save();
                }
            } else if (deliveryBoy) {
                deliveryBoy.earnings = (deliveryBoy.earnings || 0) + deliveryEarnings;
                await deliveryBoy.save();
                console.log(`Added ₨ ${deliveryEarnings} to delivery boy balance`);
            }
        }
        
        console.log(`✅ Earnings distributed for order ${order._id}`);
        
    } catch (error) {
        console.error('Error distributing earnings:', error);
    }
}

// Main webhook handler
export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    console.log("🔔 WEBHOOK RECEIVED!");

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`❌ Webhook signature failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`✅ Event: ${event.type}`);

    if (processedEvents.has(event.id)) {
        console.log(`⚠️ Duplicate skipped`);
        return res.json({ received: true });
    }
    processedEvents.add(event.id);

    await saveWebhookEvent(event);

    if (event.type === 'payment_intent.succeeded') {
        await handlePaymentIntentSucceeded(event.data.object);
    }

    res.json({ received: true });
};
