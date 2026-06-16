// backend/routes/payment.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    createPaymentIntent,
    confirmPayment,
    stripeWebhook
} from '../controllers/payment.controllers.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-payment-intent', verifyToken, createPaymentIntent);
paymentRouter.post('/confirm-payment', verifyToken, confirmPayment);
paymentRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

export default paymentRouter;