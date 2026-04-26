import prisma from '../config/database.js';

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export async function createCorrectionRequestForUser({
  userId,
  companyId,
  attendanceId,
  requestType,
  correctedTime,
  reason,
}) {
  const attendance = await prisma.attendanceRecord.findFirst({
    where: { id: attendanceId, userId, companyId },
  });
  if (!attendance) throw httpError('Attendance record not found', 404);

  const existingRequest = await prisma.correctionRequest.findFirst({
    where: {
      attendanceId,
      requesterId: userId,
      status: 'PENDING',
    },
  });
  if (existingRequest) throw httpError('Pending correction request already exists for this date', 400);

  const currentTime =
    requestType === 'MISSED_IN' || requestType === 'WRONG_IN' ? attendance.clockIn : attendance.clockOut;

  return prisma.correctionRequest.create({
    data: {
      requesterId: userId,
      companyId,
      attendanceId,
      requestType,
      currentTime,
      correctedTime,
      reason,
    },
  });
}

export async function listMyCorrectionRequests({ userId, status, page, limit }) {
  const skip = (page - 1) * limit;
  const where = { requesterId: userId };
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.correctionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        approver: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.correctionRequest.count({ where }),
  ]);

  return { requests, total, page, limit };
}

export async function getMyCorrectionRequestById({ userId, requestId }) {
  const request = await prisma.correctionRequest.findFirst({
    where: { id: requestId, requesterId: userId },
    include: {
      approver: { select: { firstName: true, lastName: true, email: true } },
    },
  });
  if (!request) throw httpError('Request not found', 404);
  return request;
}

