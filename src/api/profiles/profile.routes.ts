// src/profiles/profile.routes.ts

import { Router } from 'express';
import multer from 'multer';
import { ProfileController } from './profile.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// Multer configured for memory storage
// Files are held in memory as Buffer objects
// and passed directly to Supabase Storage
// We don't write anything to disk on the server
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit — matches Supabase bucket policy
  },
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(new Error('Only JPEG, PNG and WebP images are allowed.'));
    }
  },
});

// All routes here are protected — requireAuth runs first
// If token is invalid, middleware returns 401 before controller runs

// --- Profile Routes ---
router.get('/me', requireAuth, ProfileController.getProfile);
router.put('/me', requireAuth, ProfileController.updateProfile);
router.put('/me/metadata', requireAuth, ProfileController.updatePersonalMetadata);
router.post(
  '/me/photo',
  requireAuth,
  upload.single('photo'), // 'photo' must match the field name Flutter sends
  ProfileController.uploadProfilePhoto
);

// --- Nominee Routes ---
router.get('/nominees', requireAuth, ProfileController.getNominees);
router.post('/nominees', requireAuth, ProfileController.createNominee);
router.put('/nominees/:id', requireAuth, ProfileController.updateNominee);
router.delete('/nominees/:id', requireAuth, ProfileController.deleteNominee);

// --- Vendor Routes ---
router.get('/vendor/me', requireAuth, ProfileController.getVendorProfile);
router.get('/vendor/services', requireAuth, ProfileController.getVendorServices);
router.post('/vendor/services', requireAuth, ProfileController.addVendorService);
router.delete('/vendor/services/:id', requireAuth, ProfileController.removeVendorService);

// Admin only
router.put('/vendor/services/:id/review', requireAuth, ProfileController.reviewVendorService);

export default router;