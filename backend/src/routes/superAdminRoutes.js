import { Router } from 'express';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  getCompanyUsers,
  getCompanyAttendance,
  getAllAuditLogs,
} from '../controllers/superAdminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

// Company management
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.get('/companies/:id', getCompanyById);
router.patch('/companies/:id', updateCompany);
router.get('/companies/:id/users', getCompanyUsers);
router.get('/companies/:id/attendance', getCompanyAttendance);

// Audit logs
router.get('/audit-logs', getAllAuditLogs);

export default router;
