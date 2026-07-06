import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    chatWithBot,
    getAdminChatInstructions,
    updateAdminChatInstructions
} from '../controllers/chatbot.controllers.js';

const chatbotRouter = express.Router();

// Public chat endpoint (user may or may not be logged in)
chatbotRouter.post('/chat', async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
        } catch (_) {}
    }
    next();
}, chatWithBot);

// Admin routes for chatbot instructions
chatbotRouter.get('/admin/instructions', verifyToken, requireRole(['admin']), getAdminChatInstructions);
chatbotRouter.put('/admin/instructions', verifyToken, requireRole(['admin']), updateAdminChatInstructions);

export default chatbotRouter;
