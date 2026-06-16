// routes/deliveryZone.routes.js

import express from 'express';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';
import {
    createDeliveryZone,
    getDeliveryZones,
    updateDeliveryZone,
    deleteDeliveryZone
} from '../controllers/deliveryZone.controllers.js';

const deliveryZoneRouter = express.Router();

deliveryZoneRouter.post('/', verifyToken, requireRole(['owner']), createDeliveryZone);
deliveryZoneRouter.get('/', verifyToken, requireRole(['owner']), getDeliveryZones);
deliveryZoneRouter.put('/:zoneId', verifyToken, requireRole(['owner']), updateDeliveryZone);
deliveryZoneRouter.delete('/:zoneId', verifyToken, requireRole(['owner']), deleteDeliveryZone);

export default deliveryZoneRouter;
