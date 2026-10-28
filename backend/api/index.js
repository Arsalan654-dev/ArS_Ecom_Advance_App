// backend/api/index.js
// Vercel serverless entry point.
import '../config/env.js';
import connectDb from '../config/db.js';
import app from '../app.js';

export default async function handler(req, res) {
    try {
        await connectDb();
        return app(req, res);
    } catch (error) {
        console.error('API bootstrap failed:', error);
        return res.status(500).json({
            error: 'Server initialization failed'
        });
    }
}
