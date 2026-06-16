// backend/controllers/order.customer.controllers.js
import Order from '../models/order.model.js';
import Cart from '../models/cart.model.js';
import Restaurant from '../models/restaurant.model.js';
import Address from '../models/address.model.js';
import PromoCode from '../models/promoCode.model.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create order (for COD) or create payment intent (for online)
export const createOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const { addressId, promoCode, paymentMethod = 'cash' } = req.body;

        if (!addressId) {
            return res.status(400).json({ error: "Delivery address is required" });
        }

        // Get user's cart
        const cart = await Cart.findOne({ user: userId }).populate('items.foodItem');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: "Cart is empty" });
        }

        // Get address
        const address = await Address.findOne({ _id: addressId, user: userId });
        if (!address) {
            return res.status(404).json({ error: "Address not found" });
        }

        // Get restaurant from first cart item
        const firstItem = cart.items[0];
        const restaurant = await Restaurant.findById(firstItem.foodItem.restaurant);
        if (!restaurant) {
            return res.status(404).json({ error: "Restaurant not found" });
        }

        // Calculate total
        let subtotal = 0;
        const foodItems = cart.items.map(item => {
            const price = item.foodItem.price;
            const quantity = item.quantity;
            subtotal += price * quantity;
            return {
                foodItem: item.foodItem._id,
                quantity: quantity,
                price: price
            };
        });

        let discountApplied = 0;
        
        // Apply promo code if provided
        if (promoCode) {
            const promo = await PromoCode.findOne({ 
                code: promoCode.toUpperCase(), 
                restaurant: restaurant._id,
                isActive: true,
                validFrom: { $lte: new Date() },
                validUpto: { $gte: new Date() }
            });
            
            if (promo && (!promo.usageLimit || promo.timesUsed < promo.usageLimit)) {
                if (subtotal >= promo.minOrderValue) {
                    discountApplied = subtotal * (promo.discountPercentage / 100);
                    if (promo.maxDiscount && discountApplied > promo.maxDiscount) {
                        discountApplied = promo.maxDiscount;
                    }
                    promo.timesUsed += 1;
                    await promo.save();
                }
            }
        }

        const deliveryFee = 50;
        const totalAmount = subtotal + deliveryFee - discountApplied;

        // For COD - create order immediately with status 'pending'
        if (paymentMethod === 'cash') {
            const order = new Order({
                restaurant: restaurant._id,
                customer: userId,
                foodItems: foodItems,
                deliveryAddress: {
                    fullAddress: address.fullAddress,
                    landmark: address.landmark,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    latitude: address.latitude,
                    longitude: address.longitude,
                    phoneNumber: address.phoneNumber,
                    receiverName: address.receiverName
                },
                promoCode: promoCode || null,
                discountApplied: discountApplied,
                totalAmount: totalAmount,
                paymentMethod: 'cash',
                paymentStatus: 'pending',
                status: 'pending'
            });

            await order.save();

            // Clear the cart
            cart.items = [];
            await cart.save();

            return res.status(201).json({
                success: true,
                message: "Order placed successfully",
                order: order,
                paymentRequired: false
            });
        }

        // For ONLINE - create order with payment_pending status
        try {
            // Create Stripe Payment Intent FIRST
            const paymentIntentData = await stripe.paymentIntents.create({
                amount: Math.round(totalAmount * 100),
                currency: 'pkr',
                metadata: {
                    userId: userId.toString(),
                    cartId: cart._id.toString(),
                    orderType: 'temp'
                },
                automatic_payment_methods: {
                    enabled: true,
                },
            });
            
            console.log(`✅ Payment intent created: ${paymentIntentData.id}`);
            
            // Create order with payment_pending status
            const tempOrder = new Order({
                restaurant: restaurant._id,
                customer: userId,
                foodItems: foodItems,
                deliveryAddress: {
                    fullAddress: address.fullAddress,
                    landmark: address.landmark,
                    city: address.city,
                    state: address.state,
                    pincode: address.pincode,
                    latitude: address.latitude,
                    longitude: address.longitude,
                    phoneNumber: address.phoneNumber,
                    receiverName: address.receiverName
                },
                promoCode: promoCode || null,
                discountApplied: discountApplied,
                totalAmount: totalAmount,
                paymentMethod: 'online',
                paymentStatus: 'pending',
                paymentIntentId: paymentIntentData.id,
                status: 'payment_pending'
            });

            await tempOrder.save();
            
            // ✅ CRITICAL: Update payment intent metadata with orderId
            await stripe.paymentIntents.update(paymentIntentData.id, {
                metadata: {
                    userId: userId.toString(),
                    cartId: cart._id.toString(),
                    orderId: tempOrder._id.toString()
                }
            });
            
            console.log(`✅ Order created with paymentIntentId: ${tempOrder.paymentIntentId}`);
            console.log(`✅ Updated payment intent metadata with orderId: ${tempOrder._id}`);

            return res.status(201).json({
                success: true,
                message: "Payment intent created",
                order: tempOrder,
                clientSecret: paymentIntentData.client_secret,
                paymentRequired: true
            });
            
        } catch (stripeError) {
            console.error("Stripe error:", stripeError);
            return res.status(500).json({ 
                error: "Payment initialization failed. Please try again." 
            });
        }

    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({ error: error.message || "Failed to create order" });
    }
};

// Get user's orders (exclude payment_pending)
export const getMyOrders = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10 } = req.query;
        
        const skip = (page - 1) * limit;
        
        const orders = await Order.find({ 
            customer: userId,
            status: { $ne: 'payment_pending' }
        })
            .populate('restaurant', 'businessName logoImage')
            .populate('foodItems.foodItem', 'name price images')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Order.countDocuments({ 
            customer: userId,
            status: { $ne: 'payment_pending' }
        });
        
        return res.status(200).json({
            success: true,
            orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        });
        
    } catch (error) {
        console.error("Get my orders error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch orders" });
    }
};

// Get single order details
export const getOrderById = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId } = req.params;
        
        const order = await Order.findOne({ _id: orderId, customer: userId })
            .populate('restaurant', 'businessName logoImage phone email mainAddress')
            .populate('foodItems.foodItem', 'name price images description')
            .populate('delivery', 'deliveryBoy estimatedTime assignedAt');
        
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        return res.status(200).json({
            success: true,
            order
        });
        
    } catch (error) {
        console.error("Get order error:", error);
        return res.status(500).json({ error: error.message || "Failed to fetch order" });
    }
};

// Cancel order
export const cancelOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId } = req.params;
        
        const order = await Order.findOne({ _id: orderId, customer: userId });
        
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        if (order.status !== 'pending' && order.status !== 'preparing') {
            return res.status(400).json({ error: "Order cannot be cancelled at this stage" });
        }
        
        order.status = 'cancelled';
        await order.save();
        
        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully"
        });
        
    } catch (error) {
        console.error("Cancel order error:", error);
        return res.status(500).json({ error: error.message || "Failed to cancel order" });
    }
};

// Delete order (only delivered or cancelled)
export const deleteOrder = async (req, res) => {
    try {
        const userId = req.userId;
        const { orderId } = req.params;
        
        const order = await Order.findOne({ _id: orderId, customer: userId });
        
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }
        
        // Only allow deletion of delivered or cancelled orders
        if (order.status !== 'delivered' && order.status !== 'cancelled') {
            return res.status(400).json({ 
                error: "Only delivered or cancelled orders can be deleted" 
            });
        }
        
        await Order.deleteOne({ _id: orderId });
        
        return res.status(200).json({
            success: true,
            message: "Order deleted successfully"
        });
        
    } catch (error) {
        console.error("Delete order error:", error);
        return res.status(500).json({ error: error.message || "Failed to delete order" });
    }
};

// Delete all orders for the customer (only delivered or cancelled)
export const deleteAllOrders = async (req, res) => {
    try {
        const userId = req.userId;
        
        // Only delete delivered or cancelled orders
        const result = await Order.deleteMany({ 
            customer: userId,
            status: { $in: ['delivered', 'cancelled', 'payment_pending'] }
        });
        
        res.json({ 
            success: true, 
            message: `${result.deletedCount} orders deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error("Delete all orders error:", error);
        res.status(500).json({ error: error.message });
    }
};