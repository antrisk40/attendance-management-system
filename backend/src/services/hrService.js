import prisma from '../config/database.js';

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export async function getHrDashboardData({ companyId, date }) {
  const targetDate = date ? new Date(date) : new Date(new Date().toISOString().split('T')[0]);

  const employeeWhere = {
    companyId,
    isActive: true,
    role: { name: 'EMPLOYEE' },
  };

  const attendanceWhere = {
    companyId,
    date: targetDate,
  };

  const [
    totalEmployees,
    attendanceRecordsCount,
    presentCount,
    absentCount,
    halfDayCount,
    onLeaveCount,
    pendingRequests,
    topWorkers,
  ] = await Promise.all([
    prisma.user.count({ where: employeeWhere }),
    prisma.attendanceRecord.count({ where: attendanceWhere }),
    prisma.attendanceRecord.count({ where: { ...attendanceWhere, status: 'PRESENT' } }),
    prisma.attendanceRecord.count({ where: { ...attendanceWhere, status: 'ABSENT' } }),
    prisma.attendanceRecord.count({ where: { ...attendanceWhere, status: 'HALF_DAY' } }),
    prisma.attendanceRecord.count({ where: { ...attendanceWhere, status: 'ON_LEAVE' } }),
    prisma.correctionRequest.count({ where: { companyId, status: 'PENDING' } }),
    prisma.attendanceRecord.findMany({
      where: attendanceWhere,
      orderBy: [{ workHours: 'desc' }, { clockIn: 'asc' }],
      take: 5,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  const notCheckedIn = Math.max(0, totalEmployees - attendanceRecordsCount);

  return {
    date: targetDate.toISOString().split('T')[0],
    totals: {
      employees: totalEmployees,
      records: attendanceRecordsCount,
      pendingRequests,
    },
    statusCounts: {
      present: presentCount,
      absent: absentCount,
      halfDay: halfDayCount,
      onLeave: onLeaveCount,
      notCheckedIn,
    },
    topWorkers: topWorkers.map((r) => ({
      id: r.id,
      workHours: r.workHours,
      clockIn: r.clockIn,
      clockOut: r.clockOut,
      user: r.user,
    })),
  };
}

export async function listEmployees({ companyId, page, limit, q, isActive }) {
  const skip = (page - 1) * limit;
  const where = {
    companyId,
    role: { name: 'EMPLOYEE' },
  };

  if (typeof isActive === 'boolean') where.isActive = isActive;
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [employees, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { employees, total, page, limit };
}

export async function createEmployee({ companyId, email, password, firstName, lastName }) {
  const role = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
  if (!role) throw httpError('EMPLOYEE role missing in DB', 500);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw httpError('Email already exists', 409);

  const bcrypt = (await import('bcrypt')).default;
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: role.id,
      companyId,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: { select: { name: true } },
      isActive: true,
      createdAt: true,
    },
  });
}

export async function deactivateEmployee({ companyId, userId }) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId },
    include: { role: true },
  });
  if (!user) throw httpError('Employee not found', 404);
  if (user.role?.name !== 'EMPLOYEE') throw httpError('Can only deactivate EMPLOYEE users', 403);

  return prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

export async function getCompanyAttendance({
  companyId,
  date,
  page,
  limit,
  status,
  userId,
  sortBy,
  sortOrder,
}) {
  const skip = (page - 1) * limit;
  const where = { companyId };
  if (date) where.date = new Date(date);
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const orderBy =
    sortBy === 'user'
      ? [{ user: { firstName: sortOrder } }, { user: { lastName: sortOrder } }]
      : [{ [sortBy]: sortOrder }];

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
        },
      },
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { records, total, page, limit };
}

export async function listPendingRequests({ companyId, page, limit }) {
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    prisma.correctionRequest.findMany({
      where: { companyId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.correctionRequest.count({ where: { companyId, status: 'PENDING' } }),
  ]);

  return { requests, total, page, limit };
}

export async function listAllRequests({ companyId, status, page, limit }) {
  const skip = (page - 1) * limit;
  const where = { companyId };
  if (status) where.status = status;

  const [requests, total] = await Promise.all([
    prisma.correctionRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.correctionRequest.count({ where }),
  ]);

  return { requests, total, page, limit };
}

export async function reviewRequest({ companyId, approverId, requestId, status, remarks }) {
  const request = await prisma.correctionRequest.findFirst({
    where: { id: requestId, companyId, status: 'PENDING' },
    include: { requester: true },
  });
  if (!request) throw httpError('Request not found or already processed', 404);

  const updatedRequest = await prisma.correctionRequest.update({
    where: { id: requestId },
    data: {
      status,
      approverId,
      remarks,
      reviewedAt: new Date(),
    },
  });

  if (status === 'APPROVED') {
    const attendance = await prisma.attendanceRecord.findUnique({
      where: { id: request.attendanceId },
    });

    if (attendance) {
      const updateData = { isManual: true };
      if (request.requestType === 'MISSED_IN' || request.requestType === 'WRONG_IN') {
        updateData.clockIn = request.correctedTime;
      } else {
        updateData.clockOut = request.correctedTime;
      }

      const newClockIn =
        request.requestType === 'MISSED_IN' || request.requestType === 'WRONG_IN'
          ? request.correctedTime
          : attendance.clockIn;
      const newClockOut =
        request.requestType === 'MISSED_OUT' || request.requestType === 'WRONG_OUT'
          ? request.correctedTime
          : attendance.clockOut;

      if (newClockIn && newClockOut) {
        const diffMs = newClockOut.getTime() - newClockIn.getTime();
        updateData.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      }

      await prisma.attendanceRecord.update({
        where: { id: request.attendanceId },
        data: updateData,
      });
    }
  }

  return updatedRequest;
}

