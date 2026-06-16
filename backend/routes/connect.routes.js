// backend/routes/connect.routes.js
import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
    createConnectAccount,
    getAccountStatus,
    getBalance,
    requestPayout,
    getPayoutHistory,
    disconnectAccount
} from '../controllers/connect.controllers.js';

const connectRouter = express.Router();

connectRouter.post('/create-account', verifyToken, createConnectAccount);
connectRouter.get('/account-status', verifyToken, getAccountStatus);
connectRouter.get('/balance', verifyToken, getBalance);
connectRouter.post('/request-payout', verifyToken, requestPayout);
connectRouter.get('/payout-history', verifyToken, getPayoutHistory);
connectRouter.post('/disconnect', verifyToken, disconnectAccount);

export default connectRouter;