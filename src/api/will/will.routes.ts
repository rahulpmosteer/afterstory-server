// src/api/will/will.routes.ts

import { Router } from 'express';
import { WillController } from './will.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// --- Will Core ---
router.get('/', requireAuth, WillController.getWill);
router.post('/', requireAuth, WillController.upsertWill);

// --- Assets ---
router.post('/assets', requireAuth, WillController.createAsset);
router.put('/assets/:id', requireAuth, WillController.updateAsset);
router.delete('/assets/:id', requireAuth, WillController.deleteAsset);

// --- Beneficiaries ---
router.post('/beneficiaries', requireAuth, WillController.createBeneficiary);
router.put('/beneficiaries/:id', requireAuth, WillController.updateBeneficiary);
router.delete('/beneficiaries/:id', requireAuth, WillController.deleteBeneficiary);

// --- Distribution ---
router.get('/distribution', requireAuth, WillController.getDistribution);
router.post('/distribution', requireAuth, WillController.saveDistribution);

// --- PDF Generation ---
router.post('/generate', requireAuth, WillController.generatePdf);

export default router;

/*
import { Router } from 'express';
import { WillController } from './will.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// All will routes are protected
// A will is deeply personal — no unauthenticated access ever

// --- Will Core ---
router.get('/', requireAuth, WillController.getWill);
router.post('/', requireAuth, WillController.upsertWill);

// --- Assets ---
router.post('/assets', requireAuth, WillController.createAsset);
router.put('/assets/:id', requireAuth, WillController.updateAsset);
router.delete('/assets/:id', requireAuth, WillController.deleteAsset);

// --- Beneficiaries ---
router.post('/beneficiaries', requireAuth, WillController.createBeneficiary);
router.put('/beneficiaries/:id', requireAuth, WillController.updateBeneficiary);
router.delete('/beneficiaries/:id', requireAuth, WillController.deleteBeneficiary);

// --- PDF Generation ---
// POST not GET — generation is an action, not a fetch
router.post('/generate', requireAuth, WillController.generatePdf);

export default router;

*/