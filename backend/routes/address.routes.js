// D:\Vingo\backend\routes\address.routes.js

import express from 'express';
import {
    addAddress,
    getAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} from '../controllers/address.controllers.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const addressRouter = express.Router();

// All address routes are protected (require authentication)
addressRouter.use(verifyToken);

addressRouter.post('/', addAddress);
addressRouter.get('/', getAddresses);
addressRouter.get('/:id', getAddressById);
addressRouter.put('/:id', updateAddress);
addressRouter.delete('/:id', deleteAddress);
addressRouter.patch('/:id/default', setDefaultAddress);

export default addressRouter;