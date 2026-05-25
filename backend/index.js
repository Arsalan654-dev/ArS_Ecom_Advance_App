import './config/env.js';

import express from 'express';

import connectDb from './config/db.js';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth.routes.js';
import cors from 'cors';
import addressRouter from './routes/address.routes.js';




const app = express();
const PORT = process.env.PORT || 8000;


const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ars-vingo-app.vercel.app',  // Tumhara Vercel URL
    'https://ars-vingo-app-git-main-jaffriarsalan786-gmailcoms-projects.vercel.app',
    'https://ars-vingo-9rctnm8kt-jaffriarsalan786-gmailcoms-projects.vercel.app',
    '*.vercel.app',
    process.env.FRONTEND_URL
];


app.use(cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies to be sent with requests
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
