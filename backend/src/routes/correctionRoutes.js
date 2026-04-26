import { Router } from 'express';
import {
  createCorrectionRequest,
  getMyRequests,
  getRequestById,
} from '../controllers/correctionController.js';
import { authenticate, authorize, requireCompanyAccess } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireCompanyAccess);
router.use(authorize('EMPLOYEE', 'HR', 'ADMIN'));

router.post('/', createCorrectionRequest);
router.get('/my-requests', getMyRequests);
router.get('/:id', getRequestById);

export default router;
