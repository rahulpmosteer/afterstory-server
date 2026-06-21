// src/api/marketplace/marketplace.routes.ts

import { Router } from 'express';
import { MarketplaceController } from './marketplace.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// --- Public routes (no auth needed to browse) ---
router.get('/listings', MarketplaceController.getListings);
router.get('/listings/:id', MarketplaceController.getListing);
router.get('/commission', MarketplaceController.getCommissionConfig);

// --- Vendor routes ---
router.get(
  '/vendor/listings',
  requireAuth,
  MarketplaceController.getVendorListings
);
router.post(
  '/listings',
  requireAuth,
  MarketplaceController.createListing
);
router.put(
  '/listings/:id',
  requireAuth,
  MarketplaceController.updateListing
);
router.delete(
  '/listings/:id',
  requireAuth,
  MarketplaceController.deleteListing
);
router.get(
  '/vendor/bookings',
  requireAuth,
  MarketplaceController.getVendorBookings
);

router.get(
  '/vendor/revenue',
  requireAuth,
  MarketplaceController.getVendorRevenue
);

// --- Consumer routes ---
router.post(
  '/bookings',
  requireAuth,
  MarketplaceController.createBooking
);
router.get(
  '/consumer/bookings',
  requireAuth,
  MarketplaceController.getConsumerBookings
);
router.put(
  '/bookings/:id/status',
  requireAuth,
  MarketplaceController.updateBookingStatus
);

// --- Admin routes ---
router.put(
  '/commission',
  requireAuth,
  MarketplaceController.updateCommission
);

export default router;