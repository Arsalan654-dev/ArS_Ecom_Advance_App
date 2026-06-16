// routes/metrics.routes.js

import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    getDashboardMetrics,
    getEarningsReport,
    getSentimentAnalysis
} from '../controllers/metrics.controllers.js';

const metricsRouter = express.Router();

metricsRouter.get('/dashboard', verifyToken, requireRole(['owner']), getDashboardMetrics);
metricsRouter.get('/earnings', verifyToken, requireRole(['owner']), getEarningsReport);
metricsRouter.get('/sentiment', verifyToken, requireRole(['owner']), getSentimentAnalysis);

export default metricsRouter;
