import { Router } from 'express';
import { AuthController } from './auth.controller.js';

const router = Router();


// POST /api/v1/auth/register
router.post('/register', AuthController.register);

// POST /api/v1/auth/login
router.post('/login', AuthController.login);

export default router;
