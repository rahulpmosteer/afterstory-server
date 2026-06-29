// src/api/will/will.routes.ts

import { Router } from 'express';
import { WillController } from './will.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, WillController.getWill);
router.post('/', requireAuth, WillController.upsertWill);

router.post('/assets', requireAuth, WillController.createAsset);
router.put('/assets/:id', requireAuth, WillController.updateAsset);
router.delete('/assets/:id', requireAuth, WillController.deleteAsset);

router.post('/beneficiaries', requireAuth, WillController.createBeneficiary);
router.put('/beneficiaries/:id', requireAuth, WillController.updateBeneficiary);
router.delete('/beneficiaries/:id', requireAuth, WillController.deleteBeneficiary);

router.get('/distribution', requireAuth, WillController.getDistribution);
router.post('/distribution', requireAuth, WillController.saveDistribution);

// PDF generated on device — just mark status in DB
router.post('/mark-generated', requireAuth, WillController.markAsGenerated);

export default router;