import { Router } from 'express';
import { login, refreshToken, logout, logoutAll, getProfile } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/logout-all', authenticate, logoutAll);
router.get('/profile', authenticate, getProfile);

export default router;
