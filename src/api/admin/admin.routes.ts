// src/api/admin/admin.routes.ts

import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// All admin routes require auth + admin role
// requireAuth verifies JWT, requireAdmin checks role
router.use(requireAuth);
router.use(AdminController.requireAdmin);

router.get('/stats', AdminController.getStats);
router.get('/pending-services', AdminController.getPendingServices);
router.get('/vendors', AdminController.getAllVendors);
router.get('/users', AdminController.getAllUsers);
router.put('/services/:id/review', AdminController.reviewService);
router.get('/all-services', AdminController.getAllVendorServices);
router.put('/services/:id/review', AdminController.reviewService);

export default router;