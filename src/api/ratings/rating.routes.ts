// src/api/ratings/rating.routes.ts

import { Router } from 'express';
import { RatingController } from './rating.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Public — anyone can see vendor ratings
router.get('/vendor/:vendorId', RatingController.getVendorRatings);

// Protected — consumer only
router.post('/', requireAuth, RatingController.createRating);
router.get(
  '/booking/:bookingId',
  requireAuth,
  RatingController.getBookingRating
);

export default router;