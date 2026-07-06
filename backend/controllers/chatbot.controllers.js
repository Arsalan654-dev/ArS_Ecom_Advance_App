import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Restaurant from '../models/restaurant.model.js';
import FoodItem from '../models/foodItem.model.js';
import FoodCategory from '../models/foodCategory.model.js';
import Delivery from '../models/delivery.model.js';
import Cart from '../models/cart.model.js';
import Wishlist from '../models/wishlist.model.js';
import PromoCode from '../models/promoCode.model.js';
import Notification from '../models/Notification.model.js';

const SYSTEM_INSTRUCTIONS_STORE = {
    instruction: `You are VingoBot, a helpful customer support assistant for Vingo Food Delivery platform.

You can help with:
1. General questions about the platform
2. Order tracking and status
3. Restaurant and menu information
4. Account-related queries (when user provides credentials)
5. Delivery information
6. Promo codes and discounts

For logged-in users, you can look up their specific data.
For restaurant owners, you can help with their restaurant orders and menu.
For delivery boys, you can help with their deliveries.

Always be friendly, helpful, and concise. Use emojis occasionally to be warm.
When you don't know something, be honest about it.
Do NOT share sensitive information like passwords or payment details.
If someone asks about order details, ask for their order ID or email to look it up.`,
    updatedAt: new Date()
};

export const getSystemInstructions = async () => {
    return SYSTEM_INSTRUCTIONS_STORE.instruction;
};

export const updateSystemInstructions = async (instructions) => {
    SYSTEM_INSTRUCTIONS_STORE.instruction = instructions;
    SYSTEM_INSTRUCTIONS_STORE.updatedAt = new Date();
    return SYSTEM_INSTRUCTIONS_STORE;
};

// Model names to try (in order of preference)
const GEMINI_MODELS = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-1.0-pro'
];

// Call Gemini via the OpenAI-compatible endpoint
async function callGeminiAI(systemPrompt, userMessage) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is not set");
        return null;
    }
    const baseURL = (process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(/\/+$/, '');

    // Try each model with direct REST call (more reliable)
    for (const model of GEMINI_MODELS) {
        try {
            const apiVersions = ['v1beta', 'v1'];
            for (const version of apiVersions) {
                const geminiURL = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(geminiURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `${systemPrompt}\n\nUser: ${userMessage}`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 1000
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (reply) return reply;
                }
            }
        } catch (_) {
            // Continue to next model
        }
    }

    // Fallback: try OpenAI SDK with multiple model names
    for (const model of GEMINI_MODELS) {
        try {
            const { default: OpenAI } = await import('openai');
            const openai = new OpenAI({ apiKey, baseURL: baseURL + '/' });
            const completion = await openai.chat.completions.create({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });
            const reply = completion.choices[0]?.message?.content;
            if (reply) return reply;
        } catch (_) {
            // Continue to next model
        }
    }

    console.error("All Gemini models failed");
    return null;
}

async function fetchUserData(userId) {
    const user = await User.findById(userId).select('-password -resetOtp -twoFactorOtp -emailVerificationToken -twoFactorPhone');
    if (!user) return null;

    const data = { user: user.toObject() };

    if (user.role === 'user') {
        const orders = await Order.find({ customer: userId }).sort({ createdAt: -1 }).limit(10)
            .populate('restaurant', 'businessName');
        data.orders = orders;

        const cart = await Cart.findOne({ user: userId }).populate('items.foodItem', 'name price');
        data.cart = cart;

        const wishlist = await Wishlist.findOne({ user: userId }).populate('items.foodItem', 'name price');
        data.wishlist = wishlist;
    }

    if (user.role === 'owner' && user.restaurantId) {
        const restaurant = await Restaurant.findById(user.restaurantId);
        data.restaurant = restaurant;

        const orders = await Order.find({ restaurant: user.restaurantId }).sort({ createdAt: -1 }).limit(20)
            .populate('customer', 'fullName email');
        data.restaurantOrders = orders;

        const menuItems = await FoodItem.find({ restaurant: user.restaurantId }).populate('category', 'name');
        data.menuItems = menuItems;
    }

    if (user.role === 'deliveryBoy') {
        const deliveries = await Delivery.find({ deliveryBoy: userId }).sort({ createdAt: -1 }).limit(20)
            .populate('order');
        data.deliveries = deliveries;
    }

    return data;
}

async function fetchOrderByQuery(query) {
    let order = null;

    if (query.match(/^[0-9a-fA-F]{24}$/)) {
        order = await Order.findById(query).populate('restaurant', 'businessName').populate('customer', 'fullName email');
    } else if (query.includes('@')) {
        const user = await User.findOne({ email: query });
        if (user) {
            order = await Order.findOne({ customer: user._id }).sort({ createdAt: -1 })
                .populate('restaurant', 'businessName').populate('customer', 'fullName email');
        }
    }

    if (!order && query.length >= 6) {
        order = await Order.findOne({
            $expr: {
                $eq: [{ $substrCP: ['$_id', 0, query.length] }, query]
            }
        }).populate('restaurant', 'businessName').populate('customer', 'fullName email');
    }

    return order;
}

async function fetchRestaurantData(restaurantId) {
    const restaurant = await Restaurant.findById(restaurantId).populate('owner', 'fullName email');
    if (!restaurant) return null;

    const menu = await FoodItem.find({ restaurant: restaurantId }).populate('category', 'name');
    const orders = await Order.find({ restaurant: restaurantId }).sort({ createdAt: -1 }).limit(10)
        .populate('customer', 'fullName email');

    return { restaurant, menu, orders };
}

export const chatWithBot = async (req, res) => {
    try {
        const { message, orderQuery } = req.body;
        const userId = req.userId || null;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const instructions = await getSystemInstructions();

        let contextData = {};
        let userContext = null;

        if (userId) {
            userContext = await fetchUserData(userId);
            if (userContext) {
                contextData.loggedInUser = {
                    name: userContext.user.fullName,
                    email: userContext.user.email,
                    role: userContext.user.role,
                    isEmailVerified: userContext.user.isEmailVerified
                };

                if (userContext.user.role === 'user') {
                    contextData.myOrders = userContext.orders?.map(o => ({
                        id: o._id?.toString() || '',
                        status: o.status,
                        total: o.totalAmount,
                        restaurant: o.restaurant?.businessName,
                        date: o.createdAt,
                        items: o.foodItems?.length
                    })) || [];
                    contextData.myCartItems = userContext.cart?.items?.length || 0;
                    contextData.myWishlistItems = userContext.wishlist?.items?.length || 0;
                }

                if (userContext.user.role === 'owner') {
                    contextData.myRestaurant = {
                        name: userContext.restaurant?.businessName,
                        status: userContext.restaurant?.status,
                        menuCount: userContext.menuItems?.length || 0
                    };
                    contextData.myRestaurantOrders = userContext.restaurantOrders?.map(o => ({
                        id: o._id?.toString() || '',
                        status: o.status,
                        total: o.totalAmount,
                        customer: o.customer?.fullName,
                        date: o.createdAt
                    })) || [];
                }

                if (userContext.user.role === 'deliveryBoy') {
                    contextData.myDeliveries = userContext.deliveries?.map(d => ({
                        orderId: d.order?._id?.toString() || '',
                        status: d.status,
                        earnings: d.earnings || d.deliveryFee || 0
                    })) || [];
                }
            }
        }

        if (orderQuery) {
            const order = await fetchOrderByQuery(orderQuery);
            if (order) {
                contextData.lookedUpOrder = {
                    id: order._id?.toString() || '',
                    status: order.status,
                    total: order.totalAmount,
                    restaurant: order.restaurant?.businessName,
                    customer: order.customer?.fullName,
                    paymentMethod: order.paymentMethod,
                    paymentStatus: order.paymentStatus,
                    items: order.foodItems?.length,
                    createdAt: order.createdAt
                };
            } else {
                contextData.lookedUpOrder = null;
                contextData.orderLookupFailed = `No order found matching "${orderQuery}". Please check the order ID or email and try again.`;
            }
        }

        // Always include general restaurant/food info for context
        try {
            const restaurants = await Restaurant.find({ status: 'approved', isEnabled: true })
                .select('businessName cuisines avgRating deliveryTime mainAddress')
                .limit(10);
            contextData.availableRestaurants = restaurants.map(r => ({
                name: r.businessName,
                cuisines: r.cuisines,
                rating: r.avgRating,
                location: `${r.mainAddress?.city || ''}, ${r.mainAddress?.state || ''}`
            }));

            const foodItems = await FoodItem.find({ isAvailable: true })
                .select('name price dietary')
                .populate('restaurant', 'businessName')
                .limit(20);
            contextData.availableFoodItems = foodItems.map(f => ({
                name: f.name,
                price: f.price,
                dietary: f.dietary,
                restaurant: f.restaurant?.businessName
            }));
        } catch (_) {}

        let systemPrompt = `You are VingoBot, the official AI assistant for Vingo Food Delivery platform.

${instructions}

## CONTEXT DATA (current state):
${JSON.stringify(contextData, null, 2)}

## RESPONSE RULES:
- If the user is logged in, greet them by name and offer to help with their specific data.
- If the user asks about THEIR data (orders, cart, etc.), use the context data provided.
- If a restaurant owner asks about orders, use their restaurant order data.
- If a delivery boy asks about deliveries, use their delivery data.
- If someone asks about a specific order by ID or email (orderQuery), use the lookedUpOrder data.
- Do NOT make up information. If you don't have the data, say so politely.
- Be conversational, warm, and professional.
- Keep responses concise but helpful.
- Use the user's language (if they write in Urdu/English, respond in the same language).`;

        let reply;
        try {
            const aiReply = await callGeminiAI(systemPrompt, message);
            if (aiReply) {
                reply = aiReply;
            } else {
                reply = buildContextReply(contextData, message);
            }
        } catch (aiError) {
            console.error("Gemini API error:", aiError.message);
            reply = buildContextReply(contextData, message);
        }

        res.json({
            success: true,
            message: reply,
            context: contextData
        });

    } catch (error) {
        console.error("Chatbot error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process chat message",
            message: "Sorry, I'm having trouble right now. Please try again later."
        });
    }
};

export const getAdminChatInstructions = async (req, res) => {
    try {
        res.json({
            success: true,
            instructions: SYSTEM_INSTRUCTIONS_STORE.instruction,
            updatedAt: SYSTEM_INSTRUCTIONS_STORE.updatedAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateAdminChatInstructions = async (req, res) => {
    try {
        const { instructions } = req.body;
        if (!instructions) {
            return res.status(400).json({ error: "Instructions are required" });
        }

        const result = await updateSystemInstructions(instructions);
        res.json({
            success: true,
            message: "Chatbot instructions updated successfully",
            instructions: result.instruction,
            updatedAt: result.updatedAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Generate contextual reply when AI is unavailable
function buildContextReply(context, userMessage) {
    const msg = userMessage.toLowerCase();

    // If logged in user
    if (context.loggedInUser) {
        const { name, role } = context.loggedInUser;
        
        if (role === 'user') {
            if (msg.includes('order')) {
                const orders = context.myOrders;
                if (orders?.length) {
                    let reply = `Here are your recent orders, ${name}:\n`;
                    orders.forEach(o => {
                        reply += `• Order #${(o.id || '').toString().slice(-8)} - ${o.restaurant} - ${o.status} - ₨${o.total}\n`;
                    });
                    return reply;
                }
                return `You don't have any orders yet, ${name}. Would you like to browse restaurants?`;
            }
            if (msg.includes('cart')) {
                return `${name}, you have ${context.myCartItems || 0} items in your cart.`;
            }
            if (msg.includes('wishlist')) {
                return `${name}, you have ${context.myWishlistItems || 0} items in your wishlist.`;
            }
        }

        if (role === 'owner') {
            const rest = context.myRestaurant;
            if (rest) {
                if (msg.includes('order')) {
                    const orders = context.myRestaurantOrders;
                    if (orders?.length) {
                        let reply = `Orders for ${rest.name}:\n`;
                        orders.slice(0, 5).forEach(o => {
                            reply += `• Order #${(o.id || '').toString().slice(-8)} - ${o.customer} - ${o.status} - ₨${o.total}\n`;
                        });
                        return reply;
                    }
                    return `No orders found for ${rest.name}.`;
                }
                if (msg.includes('menu') || msg.includes('food')) {
                    return `${rest.name} has ${rest.menuCount || 0} menu items.`;
                }
                return `Welcome back, ${name}! Your restaurant "${rest.name}" is ${rest.status}. How can I help?`;
            }
        }

        if (role === 'deliveryBoy') {
            const deliveries = context.myDeliveries;
            if (deliveries?.length) {
                let reply = `Your deliveries:\n`;
                deliveries.slice(0, 5).forEach(d => {
                    reply += `• Order #${(d.orderId || '').toString().slice(-8)} - ${d.status}\n`;
                });
                return reply;
            }
            return `You have no active deliveries, ${name}.`;
        }
    }

    // Order lookup
    if (context.lookedUpOrder) {
        const o = context.lookedUpOrder;
        return `Order #${(o.id || '').toString().slice(-8)}:
• Status: ${o.status}
• Restaurant: ${o.restaurant}
• Customer: ${o.customer}
• Amount: ₨${o.total}
• Payment: ${o.paymentMethod} (${o.paymentStatus})
• Items: ${o.items}
• Date: ${new Date(o.createdAt).toLocaleDateString()}`;
    }
    if (context.orderLookupFailed) {
        return context.orderLookupFailed;
    }

    // General info
    if (msg.includes('restaurant') || msg.includes('food') || msg.includes('eat') || msg.includes('menu')) {
        let reply = `Here are our available restaurants:\n`;
        const restCount = context.availableRestaurants?.length || 0;
        if (restCount > 0) {
            context.availableRestaurants.slice(0, 5).forEach(r => {
                reply += `• ${r.name} - ${r.cuisines?.join(', ') || 'Various'} ${r.rating ? `(⭐${r.rating})` : ''}\n`;
            });
            if (restCount > 5) reply += `And ${restCount - 5} more restaurants...\n`;
            reply += `\nPopular food items:\n`;
            (context.availableFoodItems || []).slice(0, 8).forEach(f => {
                reply += `• ${f.name} - ₨${f.price} (${f.restaurant})\n`;
            });
            return reply;
        }
        return "We have many restaurants and food items available. Please sign in to see more details!";
    }

    if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('salam')) {
        const name = context.loggedInUser?.name || 'Guest';
        return `Hello ${name}! 👋 Welcome to Vingo Food Delivery. I can help you with:
• Information about restaurants and menu items
• Order tracking and status
• Account-related queries
• Delivery information
How can I assist you today?`;
    }

    return `I'm here to help you with Vingo Food Delivery! You can ask me about:
• Restaurants and their menu items
• Placing and tracking orders
• Account information (sign in for personalized help)
• Delivery details

What would you like to know? 😊`;
}
