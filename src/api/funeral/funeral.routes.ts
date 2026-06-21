// src/api/funeral/funeral.routes.ts

import { Router } from 'express';
import { FuneralController } from './funeral.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

// All funeral routes are protected
router.get('/', requireAuth, FuneralController.getFuneralPreferences);
router.post('/', requireAuth, FuneralController.upsertFuneralPreferences);
router.delete('/', requireAuth, FuneralController.deleteFuneralPreferences);

export default router;