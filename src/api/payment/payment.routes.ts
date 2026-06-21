// src/api/payment/payment.routes.ts

import { Router } from 'express';
import { PaymentController } from './payment.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.post('/create-order', requireAuth, PaymentController.createPaymentOrder);
router.post('/verify', requireAuth, PaymentController.verifyPayment);
router.get('/history', requireAuth, PaymentController.getPaymentHistory);

export default router;