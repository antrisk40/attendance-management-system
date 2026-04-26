import bcrypt from 'bcrypt';
import prisma from '../config/database.js';

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export async function listCompanyUsers({ companyId, page, limit, role, isActive }) {
  const skip = (page - 1) * limit;
  const where = { companyId };
  if (role) where.role = { name: role };
  if (typeof isActive === 'boolean') where.isActive = isActive;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: { select: { name: true } },
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit };
}

export async function createCompanyUser({ companyId, email, password, firstName, lastName, roleName }) {
  const role = await prisma.role.findUnique({ where: { name: roleName } });
  if (!role) throw httpError('Invalid role', 400);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw httpError('Email already exists', 409);

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

export async function updateCompanyUser({ companyId, actorUserId, userId, updateData }) {
  const existingUser = await prisma.user.findFirst({
    where: { id: userId, companyId },
  });
  if (!existingUser) throw httpError('User not found', 404);

  if (updateData.isActive === false && userId === actorUserId) {
    throw httpError('Cannot deactivate your own account', 400);
  }

  const data = { ...updateData };
  if (updateData.role) {
    const role = await prisma.role.findUnique({ where: { name: updateData.role } });
    if (!role) throw httpError('Invalid role', 400);
    data.roleId = role.id;
    delete data.role;
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: { select: { name: true } },
      isActive: true,
      updatedAt: true,
    },
  });
}

export async function getCompanySettings({ companyId }) {
  return prisma.companySettings.findUnique({ where: { companyId } });
}

export async function updateCompanySettings({ companyId, updateData }) {
  return prisma.companySettings.upsert({
    where: { companyId },
    update: updateData,
    create: {
      companyId,
      ...updateData,
    },
  });
}

export async function getCompanyAttendance({ companyId, date, page, limit }) {
  const skip = (page - 1) * limit;
  const where = {
    companyId,
    date: new Date(date),
  };

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { clockIn: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { records, total, page, limit, date };
}

export async function updateAttendanceRecord({ companyId, recordId, updateData }) {
  const record = await prisma.attendanceRecord.findFirst({
    where: { id: recordId, companyId },
  });
  if (!record) throw httpError('Attendance record not found', 404);

  const data = { isManual: true };
  if (updateData.clockIn) data.clockIn = new Date(updateData.clockIn);
  if (updateData.clockOut) data.clockOut = new Date(updateData.clockOut);
  if (updateData.status) data.status = updateData.status;

  const clockIn = data.clockIn || record.clockIn;
  const clockOut = data.clockOut || record.clockOut;
  if (clockIn && clockOut) {
    const diffMs = clockOut.getTime() - clockIn.getTime();
    data.workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
  }

  return prisma.attendanceRecord.update({
    where: { id: recordId },
    data,
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

