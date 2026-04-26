import prisma from '../config/database.js';

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export async function listCompanies({ page, limit, isActive }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (typeof isActive === 'boolean') where.isActive = isActive;

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: { select: { users: true, attendanceRecords: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  return { companies, total, page, limit };
}

export async function getCompanyById({ companyId }) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      settings: true,
      _count: { select: { users: true, attendanceRecords: true } },
    },
  });
  if (!company) throw httpError('Company not found', 404);
  return company;
}

export async function createCompany({ name, slug }) {
  const existing = await prisma.company.findUnique({ where: { slug } });
  if (existing) throw httpError('Company slug already exists', 409);

  return prisma.company.create({
    data: {
      name,
      slug,
      isActive: true,
      settings: {
        create: {
          workStartTime: '09:00',
          workEndTime: '18:00',
          gracePeriodMin: 15,
          halfDayAfterMin: 240,
          fullDayHours: 8.0,
          timezone: 'Asia/Kolkata',
        },
      },
    },
    include: { settings: true },
  });
}

export async function updateCompany({ companyId, updateData }) {
  return prisma.company.update({
    where: { id: companyId },
    data: updateData,
  });
}

export async function listCompanyUsers({ companyId, page, limit }) {
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where: { companyId },
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
    prisma.user.count({ where: { companyId } }),
  ]);
  return { users, total, page, limit };
}

export async function listCompanyAttendance({ companyId, date, page, limit }) {
  const skip = (page - 1) * limit;
  const where = { companyId, date: new Date(date) };
  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { clockIn: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.attendanceRecord.count({ where }),
  ]);
  return { records, total, page, limit, date };
}

export async function listAuditLogs({ page, limit, companyId, action }) {
  const skip = (page - 1) * limit;
  const where = {};
  if (companyId) where.companyId = companyId;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, total, page, limit };
}

