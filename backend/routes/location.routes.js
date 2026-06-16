// backend/routes/location.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    updateLocation,
    getDeliveryLocation,
    getLocationHistory
} from '../controllers/location.controllers.js';

const locationRouter = express.Router();

// Delivery boy routes
locationRouter.post('/update', verifyToken, updateLocation);

// Customer routes
locationRouter.get('/delivery/:orderId', verifyToken, getDeliveryLocation);

// Delivery boy route for history
locationRouter.get('/history/:orderId', verifyToken, getLocationHistory);

export default locationRouter;