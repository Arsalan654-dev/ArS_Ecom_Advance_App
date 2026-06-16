// routes/promoCode.routes.js

import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    createPromoCode,
    getPromoCodes,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode
} from '../controllers/promoCode.controllers.js';

const promoCodeRouter = express.Router();

promoCodeRouter.post('/', verifyToken, requireRole(['owner']), createPromoCode);
promoCodeRouter.get('/', verifyToken, requireRole(['owner']), getPromoCodes);
promoCodeRouter.put('/:codeId', verifyToken, requireRole(['owner']), updatePromoCode);
promoCodeRouter.delete('/:codeId', verifyToken, requireRole(['owner']), deletePromoCode);
promoCodeRouter.post('/validate', validatePromoCode);

export default promoCodeRouter;
