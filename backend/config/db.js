// backend/config/db.js

import './env.js';
import mongoose from "mongoose";

// Cache the connection across serverless invocations on Vercel.
const globalCache = globalThis;
const cached = globalCache.__vingoMongoose || (globalCache.__vingoMongoose = {
    conn: null,
    promise: null
});

const connectDb = async () => {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        console.log("⏳ Connecting to MongoDB...");
        cached.promise = mongoose.connect(process.env.MONGO_URI).then((instance) => {
            console.log("✅ MongoDB connected successfully");
            return instance;
        });
    }

    try {
        cached.conn = await cached.promise;
        return cached.conn;
    } catch (error) {
        cached.promise = null;
        console.error("❌ MongoDB connection failed:", error.message);
        throw error;
    }
};

export default connectDb;
