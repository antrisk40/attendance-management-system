import { successResponse, errorResponse } from '../utils/response.js';
import {
  checkInUser,
  checkOutUser,
  getTodayStatus as getTodayStatusSvc,
  getAttendanceHistory,
} from '../services/attendanceService.js';

export const checkIn = async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const record = await checkInUser({ userId, companyId });
  return successResponse(res, record, 'Check-in successful');
};

export const checkOut = async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;

  if (!companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  const updatedRecord = await checkOutUser({ userId, companyId });
  return successResponse(res, updatedRecord, 'Check-out successful');
};

export const getTodayStatus = async (req, res) => {
  const userId = req.user.id;
  const companyId = req.user.companyId;
  const record = await getTodayStatusSvc({ userId, companyId });

  if (!record) {
    return successResponse(res, { status: 'NOT_CHECKED_IN' }, 'Not checked in yet');
  }

  return successResponse(res, record, 'Today status retrieved');
};

export const getHistory = async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 30, startDate, endDate } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const { records, total } = await getAttendanceHistory({
    userId,
    page: pageNum,
    limit: limitNum,
    startDate,
    endDate,
  });

  return successResponse(
    res,
    {
      records,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
    'Attendance history retrieved'
  );
};
