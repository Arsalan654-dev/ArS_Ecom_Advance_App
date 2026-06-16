// backend/routes/webhook.routes.js
import express from 'express';
import { handleStripeWebhook } from '../controllers/webhook.controllers.js';

const webhookRouter = express.Router();

// Add debug middleware to see if route is hit
webhookRouter.use((req, res, next) => {
    console.log(`🔔 [DEBUG] Webhook route accessed: ${req.method} ${req.url}`);
    console.log(`🔔 [DEBUG] Headers:`, JSON.stringify(req.headers, null, 2));
    next();
});

webhookRouter.post('/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
    console.log(`🔔 [DEBUG] Stripe webhook POST received!`);
    console.log(`🔔 [DEBUG] Body length: ${req.body?.length}`);
    next();
}, handleStripeWebhook);

export default webhookRouter;