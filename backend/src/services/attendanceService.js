import prisma from '../config/database.js';

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const getCompanyTimezone = async (companyId) => {
  if (!companyId) return 'UTC';
  const settings = await prisma.companySettings.findUnique({
    where: { companyId },
    select: { timezone: true },
  });
  return settings?.timezone || 'UTC';
};

export const getTodayDate = async (companyId) => {
  const timeZone = await getCompanyTimezone(companyId);

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = Number(parts.find((p) => p.type === 'year')?.value);
  const month = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);

  // For Prisma @db.Date (Postgres DATE), use a stable UTC midnight for that calendar day.
  return new Date(Date.UTC(year, month - 1, day));
};

const calculateWorkHours = (clockIn, clockOut) => {
  const diffMs = clockOut.getTime() - clockIn.getTime();
  return parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
};

export async function checkInUser({ userId, companyId }) {
  const today = await getTodayDate(companyId);

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (existingRecord?.clockIn) throw httpError('Already checked in today', 400);

  const now = new Date();
  return prisma.attendanceRecord.upsert({
    where: { userId_date: { userId, date: today } },
    update: {
      clockIn: now,
      status: 'PRESENT',
    },
    create: {
      userId,
      companyId,
      date: today,
      clockIn: now,
      status: 'PRESENT',
    },
  });
}

export async function checkOutUser({ userId, companyId }) {
  const today = await getTodayDate(companyId);

  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  if (!record?.clockIn) throw httpError('Must check in before checking out', 400);
  if (record.clockOut) throw httpError('Already checked out today', 400);

  const now = new Date();
  const workHours = calculateWorkHours(record.clockIn, now);

  return prisma.attendanceRecord.update({
    where: { id: record.id },
    data: { clockOut: now, workHours },
  });
}

export async function getTodayStatus({ userId, companyId }) {
  const today = await getTodayDate(companyId);
  const record = await prisma.attendanceRecord.findUnique({
    where: { userId_date: { userId, date: today } },
  });
  return record;
}

export async function getAttendanceHistory({ userId, page, limit, startDate, endDate }) {
  const skip = (page - 1) * limit;
  const where = { userId };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  return { records, total, page, limit };
}

