import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  listCompanyUsers,
  createCompanyUser,
  updateCompanyUser,
  getCompanySettings as getCompanySettingsSvc,
  updateCompanySettings as updateCompanySettingsSvc,
  getCompanyAttendance as getCompanyAttendanceSvc,
  updateAttendanceRecord,
} from '../services/adminService.js';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['EMPLOYEE', 'HR', 'ADMIN']),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['EMPLOYEE', 'HR', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

const updateSettingsSchema = z.object({
  workStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  workEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  gracePeriodMin: z.number().int().min(0).optional(),
  halfDayAfterMin: z.number().int().min(0).optional(),
  fullDayHours: z.number().min(0).max(24).optional(),
  timezone: z.string().optional(),
});

const updateAttendanceSchema = z.object({
  clockIn: z.string().datetime().optional(),
  clockOut: z.string().datetime().optional(),
  status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE']).optional(),
});

export const getUsers = async (req, res) => {
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const { page = 1, limit = 20, role, isActive } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const isActiveBool = isActive !== undefined ? isActive === 'true' : undefined;

  const { users, total } = await listCompanyUsers({
    companyId,
    page: pageNum,
    limit: limitNum,
    role,
    isActive: isActiveBool,
  });

  return successResponse(
    res,
    {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Users retrieved'
  );
};

export const createUser = async (req, res) => {
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const { email, password, firstName, lastName, role: roleName } = createUserSchema.parse(req.body);
  const user = await createCompanyUser({ companyId, email, password, firstName, lastName, roleName });

  return successResponse(res, user, 'User created', 201);
};

export const updateUser = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const updateData = updateUserSchema.parse(req.body);

  const user = await updateCompanyUser({
    companyId,
    actorUserId: req.user.id,
    userId: id,
    updateData,
  });

  return successResponse(res, user, 'User updated');
};

export const getCompanySettings = async (req, res) => {
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const settings = await getCompanySettingsSvc({ companyId });

  return successResponse(res, settings, 'Settings retrieved');
};

export const updateCompanySettings = async (req, res) => {
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const updateData = updateSettingsSchema.parse(req.body);
  const settings = await updateCompanySettingsSvc({ companyId, updateData });

  return successResponse(res, settings, 'Settings updated');
};

export const getCompanyAttendance = async (req, res) => {
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const { date = new Date().toISOString().split('T')[0], page = 1, limit = 50 } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { records, total } = await getCompanyAttendanceSvc({
    companyId,
    date,
    page: pageNum,
    limit: limitNum,
  });

  return successResponse(
    res,
    {
      records,
      date,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Company attendance retrieved'
  );
};

export const updateAttendance = async (req, res) => {
  const companyId = req.user.companyId;
  const { id } = req.params;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const updateData = updateAttendanceSchema.parse(req.body);
  const updatedRecord = await updateAttendanceRecord({
    companyId,
    recordId: id,
    updateData,
  });

  return successResponse(res, updatedRecord, 'Attendance updated');
};
