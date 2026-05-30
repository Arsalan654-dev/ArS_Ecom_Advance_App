// backend\index.js

import './config/env.js';
import express from 'express';
import connectDb from './config/db.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';
import addressRouter from './routes/address.routes.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT;

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
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/address", addressRouter);

connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
        console.log(`🔐 Google OAuth configured`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
});
