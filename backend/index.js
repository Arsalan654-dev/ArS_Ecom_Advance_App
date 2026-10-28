// backend/index.js

import './config/env.js';
import http from 'http';
import app from './app.js';
import connectDb from './config/db.js';
import { initializeSocket } from './socket.js';

const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// Initialize socket.io for long-running hosts (local/Railway). Serverless
// deployments still serve the REST API through api/index.js.
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
