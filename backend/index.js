// backend\index.js

import './config/env.js';
import express from 'express';
import http from 'http';
import connectDb from './config/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';

//routes
import authRouter from './routes/auth.routes.js';
import addressRouter from './routes/address.routes.js';
import restaurantRouter from './routes/restaurant.routes.js';
import foodItemRouter from './routes/foodItem.routes.js';
import promoCodeRouter from './routes/promoCode.routes.js';
import deliveryZoneRouter from './routes/deliveryZone.routes.js';
import orderRouter from './routes/order.routes.js';
import metricsRouter from './routes/metrics.routes.js';
import customerRouter from './routes/customer.routes.js';
import orderCustomerRouter from './routes/order.customer.routes.js';
import deliveryRouter from './routes/delivery.routes.js';
import paymentRouter from './routes/payment.routes.js';
import webhookRouter from './routes/webhook.routes.js';
import locationRouter from './routes/location.routes.js';
import notificationRouter from './routes/notification.routes.js';
import connectRouter from './routes/connect.routes.js';

//socket
import { initializeSocket } from './socket.js';


const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;

// Add to backend/index.js temporarily
app.post('/test-webhook', express.raw({ type: 'application/json' }), (req, res) => {
    console.log('Test webhook received!');
    console.log('Body:', req.body);
    res.json({ received: true });
});
// Webhook route MUST come before express.json()
app.use("/api/webhook", webhookRouter);

app.use(express.json());
app.use(cookieParser());
// Initialize socket.io

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://vingo-frontend-zeta.vercel.app',
    'https://*.vercel.app',
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')|| origin.includes('localhost')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});





app.use("/api/auth", authRouter);
app.use("/api/address", addressRouter);
app.use("/api/restaurant", restaurantRouter);
app.use("/api/food-item", foodItemRouter);
app.use("/api/promo-code", promoCodeRouter);
app.use("/api/delivery-zone", deliveryZoneRouter);
app.use("/api/order", orderRouter);
app.use("/api/metrics", metricsRouter);
app.use("/api", customerRouter);
app.use("/api", orderCustomerRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/location", locationRouter);
app.use("/api/connect", connectRouter);
app.use("/api/notifications", notificationRouter); 

initializeSocket(server);


connectDb().then(() => {
    server.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
        console.log(`🔐 Google OAuth configured`);
        console.log(`🔌 WebSocket server ready`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
});
