import { Router } from 'express';
import { checkIn, checkOut, getTodayStatus, getHistory } from '../controllers/attendanceController.js';
import { authenticate, authorize, requireCompanyAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireCompanyAccess);

router.post('/check-in', authorize('EMPLOYEE', 'HR', 'ADMIN'), checkIn);
router.post('/check-out', authorize('EMPLOYEE', 'HR', 'ADMIN'), checkOut);
router.get('/today', getTodayStatus);
router.get('/history', getHistory);

export default router;
