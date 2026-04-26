import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  getCompanySettings,
  updateCompanySettings,
  getCompanyAttendance,
  updateAttendance,
} from '../controllers/adminController.js';
import { authenticate, authorize, requireCompanyAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireCompanyAccess);
router.use(authorize('ADMIN'));

// User management
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);

// Settings
router.get('/settings', getCompanySettings);
router.patch('/settings', updateCompanySettings);

// Attendance
router.get('/attendance', getCompanyAttendance);
router.patch('/attendance/:id', updateAttendance);

export default router;
