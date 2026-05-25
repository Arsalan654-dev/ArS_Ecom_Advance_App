import './config/env.js';

import express from 'express';

import connectDb from './config/db.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';
import cors from 'cors';
import addressRouter from './routes/address.routes.js';




const app = express();
const PORT = process.env.PORT;


const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://vingo-frontend-zeta.vercel.app',  // Your Vercel URL (update after deploy)
    'https://*.vercel.app',
    process.env.FRONTEND_URL
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            console.log('Origin blocked:', origin);
            callback(null, true); // For development, allow all
            // callback(new Error('Not allowed by CORS')); // For production
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());


app.use("/api/auth", authRouter);
app.use("/api/address", addressRouter);


// Connect to database BEFORE starting server
connectDb().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
        console.log(`📧 Email configured: ${process.env.SMTP_USER ? 'Yes' : 'No'}`);
        console.log(`🔐 Google OAuth configured: ${process.env.GOOGLE_CLIENT_ID ? 'Yes' : 'No'}`);
    });
}).catch(err => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
});
