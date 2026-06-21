// src/api/organ/organ.routes.ts

import { Router } from 'express';
import { OrganController } from './organ.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, OrganController.getOrganDonationPledge);
router.post('/', requireAuth, OrganController.upsertOrganDonationPledge);
router.delete('/', requireAuth, OrganController.deleteOrganDonationPledge);

export default router;