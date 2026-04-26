import { Router } from 'express';
import {
  getPendingRequests,
  getAllRequests,
  reviewRequest,
  getEmployees,
  createEmployee,
  deactivateEmployee,
  getCompanyAttendanceForHr,
  getHrDashboard,
} from '../controllers/hrController.js';
import { authenticate, authorize, requireCompanyAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireCompanyAccess);
router.use(authorize('HR', 'ADMIN'));

// Employee management (HR can manage employees)
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.delete('/employees/:id', deactivateEmployee);

// Attendance dashboard
router.get('/attendance', getCompanyAttendanceForHr);
router.get('/dashboard', getHrDashboard);

router.get('/pending-requests', getPendingRequests);
router.get('/requests', getAllRequests);
router.post('/requests/:id/review', reviewRequest);

export default router;
