import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  getHrDashboardData,
  listEmployees as listEmployeesSvc,
  createEmployee as createEmployeeSvc,
  deactivateEmployee as deactivateEmployeeSvc,
  getCompanyAttendance as getCompanyAttendanceSvc,
  listPendingRequests as listPendingRequestsSvc,
  listAllRequests as listAllRequestsSvc,
  reviewRequest as reviewRequestSvc,
} from '../services/hrService.js';

const createEmployeeSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const employeeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(20),
  q: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

const hrAttendanceQuerySchema = z.object({
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE']).optional(),
  userId: z.string().uuid().optional(),
  sortBy: z.enum(['clockIn', 'clockOut', 'workHours', 'createdAt', 'user']).optional().default('clockIn'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

const hrDashboardQuerySchema = z.object({
  date: z.string().optional(),
});

const reviewRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  remarks: z.string().optional(),
});

export const getHrDashboard = async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId) return errorResponse(res, 'No company assigned', 403);

  const { date } = hrDashboardQuerySchema.parse(req.query);
  const data = await getHrDashboardData({ companyId, date });
  return successResponse(res, data, 'HR dashboard data');
};

export const getEmployees = async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId) return errorResponse(res, 'No company assigned', 403);

  const { page, limit, q, isActive } = employeeQuerySchema.parse(req.query);
  const { employees, total } = await listEmployeesSvc({ companyId, page, limit, q, isActive });

  return successResponse(
    res,
    {
      employees,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
    'Employees retrieved'
  );
};

export const createEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId) return errorResponse(res, 'No company assigned', 403);

  const { email, password, firstName, lastName } = createEmployeeSchema.parse(req.body);
  const user = await createEmployeeSvc({ companyId, email, password, firstName, lastName });

  return successResponse(res, user, 'Employee created', 201);
};

export const deactivateEmployee = async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId) return errorResponse(res, 'No company assigned', 403);

  const { id } = req.params;
  const updated = await deactivateEmployeeSvc({ companyId, userId: id });

  return successResponse(res, updated, 'Employee deactivated');
};

export const getCompanyAttendanceForHr = async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId) return errorResponse(res, 'No company assigned', 403);

  const { date, page, limit, status, userId, sortBy, sortOrder } = hrAttendanceQuerySchema.parse(req.query);
  const { records, total } = await getCompanyAttendanceSvc({
    companyId,
    date,
    page,
    limit,
    status,
    userId,
    sortBy,
    sortOrder,
  });

  return successResponse(
    res,
    {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
    'Attendance retrieved'
  );
};

export const getPendingRequests = async (req, res) => {
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const { page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { requests, total } = await listPendingRequestsSvc({
    companyId,
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
    'Pending requests retrieved'
  );
};

export const getAllRequests = async (req, res) => {
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const { status, page = 1, limit = 20 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { requests, total } = await listAllRequestsSvc({
    companyId,
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
    'All requests retrieved'
  );
};

export const reviewRequest = async (req, res) => {
  const approverId = req.user.id;
  const companyId = req.user.companyId;
  const { id } = req.params;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const { status, remarks } = reviewRequestSchema.parse(req.body);
  const updatedRequest = await reviewRequestSvc({
    companyId,
    approverId,
    requestId: id,
    status,
    remarks,
  });

  return successResponse(res, updatedRequest, `Request ${status.toLowerCase()}`);
};
