import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  createCorrectionRequestForUser,
  listMyCorrectionRequests,
  getMyCorrectionRequestById,
} from '../services/correctionService.js';

const createRequestSchema = z.object({
  attendanceId: z.string().uuid('Invalid attendance ID'),
  requestType: z.enum(['MISSED_IN', 'MISSED_OUT', 'WRONG_IN', 'WRONG_OUT']),
  correctedTime: z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), 'Invalid datetime'),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
});

export const createCorrectionRequest = async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const { attendanceId, requestType, correctedTime, reason } = createRequestSchema.parse(req.body);
  const request = await createCorrectionRequestForUser({
    userId,
    companyId,
    attendanceId,
    requestType,
    correctedTime,
    reason,
  });

  return successResponse(res, request, 'Correction request submitted');
};

export const getMyRequests = async (req, res) => {
  const userId = req.user.id;
  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { requests, total } = await listMyCorrectionRequests({
    userId,
    status,
    page: pageNum,
    limit: limitNum,
  });

  return successResponse(
    res,
    {
      requests,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Correction requests retrieved'
  );
};

export const getRequestById = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const request = await getMyCorrectionRequestById({ userId, requestId: id });

  return successResponse(res, request, 'Request retrieved');
};
