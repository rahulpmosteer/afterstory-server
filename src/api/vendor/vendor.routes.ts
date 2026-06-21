// src/api/vendor/vendor.routes.ts

import { Router } from 'express';
import { VendorController } from './vendor.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// All vendor routes are protected
router.get('/profile', requireAuth, VendorController.getVendorProfile);
router.post('/profile', requireAuth, VendorController.upsertVendorMetadata);
router.get('/onboarding-status', requireAuth, VendorController.getOnboardingStatus);

export default router;