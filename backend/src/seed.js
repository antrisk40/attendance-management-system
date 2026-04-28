import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/** Calendar @db.Date as UTC midnight (matches attendance service / PostgreSQL DATE) */
function cal(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

/** Clock time on a given calendar day in India (IST) */
function istAt(y, m, d, hh, mm) {
  return new Date(
    `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T` +
      `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00+05:30`
  );
}

function hoursBetween(a, b) {
  if (!a || !b) return null;
  return Math.round(((b - a) / 36e5) * 100) / 100;
}

async function main() {
  console.log('Starting database seed...');

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SUPER_ADMIN' },
      update: {},
      create: { name: 'SUPER_ADMIN', description: 'Platform owner with access to all companies' },
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Company administrator' },
    }),
    prisma.role.upsert({
      where: { name: 'HR' },
      update: {},
      create: { name: 'HR', description: 'HR manager for correction approvals' },
    }),
    prisma.role.upsert({
      where: { name: 'EMPLOYEE' },
      update: {},
      create: { name: 'EMPLOYEE', description: 'Regular employee' },
    }),
  ]);
  const R = (name) => roles.find((r) => r.name === name);
  console.log('Roles:', roles.map((r) => r.name).join(', '));

  const superAdminPassword = await bcrypt.hash('super123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const hrPassword = await bcrypt.hash('hr123', 10);
  const empPassword = await bcrypt.hash('emp123', 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {},
    create: {
      email: 'superadmin@platform.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: R('SUPER_ADMIN').id,
      isActive: true,
    },
  });
  console.log('Super Admin:', superAdmin.email);

  // firstname.lastname@company — .co.in style (matches seed2.js migration for existing DBs)
  const companiesData = [
    {
      name: 'Nakshatra Infotech Pvt Ltd',
      slug: 'nakshatra-infotech',
      users: [
        { email: 'raghav.iyer@nakshatrainfotech.co.in', role: 'ADMIN', firstName: 'Raghav', lastName: 'Iyer' },
        { email: 'kavya.reddy@nakshatrainfotech.co.in', role: 'HR', firstName: 'Kavya', lastName: 'Reddy' },
        { email: 'vikram.mehta@nakshatrainfotech.co.in', role: 'EMPLOYEE', firstName: 'Vikram', lastName: 'Mehta' },
        { email: 'ananya.shah@nakshatrainfotech.co.in', role: 'EMPLOYEE', firstName: 'Ananya', lastName: 'Shah' },
        { email: 'rohan.kulkarni@nakshatrainfotech.co.in', role: 'EMPLOYEE', firstName: 'Rohan', lastName: 'Kulkarni' },
      ],
    },
    {
      name: 'Arvind Engineering Works',
      slug: 'arvind-engineering',
      users: [
        { email: 'suresh.patel@arvindengineering.co.in', role: 'ADMIN', firstName: 'Suresh', lastName: 'Patel' },
        { email: 'deepa.nair@arvindengineering.co.in', role: 'HR', firstName: 'Deepa', lastName: 'Nair' },
        { email: 'priya.desai@arvindengineering.co.in', role: 'EMPLOYEE', firstName: 'Priya', lastName: 'Desai' },
        { email: 'karan.thakur@arvindengineering.co.in', role: 'EMPLOYEE', firstName: 'Karan', lastName: 'Thakur' },
      ],
    },
    {
      name: 'Meera Healthcare Systems',
      slug: 'meera-healthcare',
      users: [
        { email: 'anil.bose@meerahealthcare.co.in', role: 'ADMIN', firstName: 'Dr. Anil', lastName: 'Bose' },
        { email: 'lakshmi.menon@meerahealthcare.co.in', role: 'HR', firstName: 'Lakshmi', lastName: 'Menon' },
        { email: 'aditi.rao@meerahealthcare.co.in', role: 'EMPLOYEE', firstName: 'Aditi', lastName: 'Rao' },
        { email: 'siddharth.mukherjee@meerahealthcare.co.in', role: 'EMPLOYEE', firstName: 'Siddharth', lastName: 'Mukherjee' },
        { email: 'neha.bansal@meerahealthcare.co.in', role: 'EMPLOYEE', firstName: 'Neha', lastName: 'Bansal' },
      ],
    },
  ];

  const companies = [];
  const allUsers = [];

  for (const c of companiesData) {
    const company = await prisma.company.upsert({
      where: { slug: c.slug },
      update: { name: c.name, isActive: true },
      create: {
        name: c.name,
        slug: c.slug,
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
    });
    await prisma.companySettings.upsert({
      where: { companyId: company.id },
      update: { timezone: 'Asia/Kolkata' },
      create: {
        companyId: company.id,
        workStartTime: '09:00',
        workEndTime: '18:00',
        gracePeriodMin: 15,
        halfDayAfterMin: 240,
        fullDayHours: 8.0,
        timezone: 'Asia/Kolkata',
      },
    });
    companies.push(company);
    console.log('Company:', company.name);

    for (const u of c.users) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: { firstName: u.firstName, lastName: u.lastName, companyId: company.id, isActive: true },
        create: {
          email: u.email,
          password: u.role === 'ADMIN' ? adminPassword : u.role === 'HR' ? hrPassword : empPassword,
          firstName: u.firstName,
          lastName: u.lastName,
          roleId: R(u.role).id,
          companyId: company.id,
          isActive: true,
        },
      });
      allUsers.push({ user, companyId: company.id, slug: c.slug, role: u.role });
    }
  }

  // —— Attendance around 26 Apr 2026 (Mon 20th–Sun 26th); varied per employee ——
  // Apr 2026: 20 Mon, 21 Tue, 22 Wed, 23 Thu, 24 Fri, 25 Sat, 26 Sun
  const employees = allUsers.filter((x) => x.role === 'EMPLOYEE');

  /** Per-employee plan: (dayOfMonth, status, inH, inM, outH, outM) or absent/half/leave */
  const patterns = {
    'nakshatra-infotech': {
      vikram: [
        [20, 'PRESENT', 9, 5, 18, 10],
        [21, 'PRESENT', 9, 20, 17, 45],
        [22, 'HALF_DAY', 9, 15, 13, 30],
        [23, 'PRESENT', 8, 55, 18, 0],
        [24, 'PRESENT', 9, 0, 18, 5],
        [25, 'ABSENT'], // weekend optional absence
        [26, 'ON_LEAVE'], // Sunday
      ],
      ananya: [
        [20, 'PRESENT', 9, 30, 18, 20],
        [21, 'PRESENT', 9, 0, 18, 0],
        [22, 'PRESENT', 9, 10, 18, 15],
        [23, 'PRESENT', 9, 5, 17, 50],
        [24, 'HALF_DAY', 9, 45, 14, 0],
        [25, 'ABSENT'],
        [26, 'PRESENT', 10, 0, 16, 30], // Sunday visit / on-call
      ],
      rohan: [
        [20, 'PRESENT', 9, 0, 18, 0],
        [21, 'ABSENT'],
        [22, 'PRESENT', 9, 15, 18, 30],
        [23, 'PRESENT', 8, 50, 18, 10],
        [24, 'PRESENT', 9, 0, 18, 0],
        [25, 'PRESENT', 9, 30, 14, 0], // short Saturday
        [26, 'PRESENT', 11, 0, 15, 0],
      ],
    },
    'arvind-engineering': {
      priya: [
        [20, 'PRESENT', 8, 45, 17, 30],
        [21, 'PRESENT', 9, 0, 18, 0],
        [22, 'PRESENT', 9, 0, 18, 0],
        [23, 'PRESENT', 9, 0, 18, 0],
        [24, 'PRESENT', 8, 55, 18, 5],
        [25, 'ON_LEAVE'],
        [26, 'PRESENT', 9, 15, 13, 0],
      ],
      karan: [
        [20, 'PRESENT', 9, 0, 18, 0],
        [21, 'HALF_DAY', 9, 0, 13, 15],
        [22, 'PRESENT', 9, 20, 18, 45],
        [23, 'PRESENT', 8, 40, 17, 55],
        [24, 'PRESENT', 9, 5, 18, 20],
        [25, 'ABSENT'],
        [26, 'ABSENT'],
      ],
    },
    'meera-healthcare': {
      aditi: [
        [20, 'PRESENT', 8, 0, 16, 30],
        [21, 'PRESENT', 8, 10, 16, 45],
        [22, 'PRESENT', 7, 45, 16, 0],
        [23, 'PRESENT', 8, 0, 16, 30],
        [24, 'PRESENT', 7, 30, 16, 0],
        [25, 'PRESENT', 9, 0, 14, 0], // weekend duty
        [26, 'PRESENT', 8, 0, 12, 0], // Sunday
      ],
      siddharth: [
        [20, 'PRESENT', 9, 30, 19, 0],
        [21, 'PRESENT', 9, 0, 18, 0],
        [22, 'ABSENT'],
        [23, 'PRESENT', 9, 15, 18, 30],
        [24, 'PRESENT', 9, 0, 18, 0],
        [25, 'PRESENT', 9, 0, 15, 0],
        [26, 'HALF_DAY', 9, 0, 13, 0],
      ],
      neha: [
        [20, 'PRESENT', 8, 30, 17, 0],
        [21, 'PRESENT', 8, 15, 17, 0],
        [22, 'PRESENT', 8, 0, 17, 0],
        [23, 'ON_LEAVE'],
        [24, 'PRESENT', 8, 0, 17, 30],
        [25, 'PRESENT', 9, 0, 16, 0],
        [26, 'PRESENT', 10, 0, 14, 0],
      ],
    },
  };

  const key = (u) => {
    const [local] = u.user.email.split('@');
    if (local.includes('.')) {
      return local.split('.')[0];
    }
    return local;
  };

  for (const { user, companyId, slug } of employees) {
    const k = key({ user });
    const list = patterns[slug]?.[k];
    if (!list) {
      console.warn('No pattern for', user.email, slug, k);
      continue;
    }

    for (const row of list) {
      const [d, status, inH, inM, outH, outM] = row;
      const date = cal(2026, 4, d);
      const clockIn =
        status === 'PRESENT' || status === 'HALF_DAY' ? istAt(2026, 4, d, inH, inM) : null;
      const clockOut =
        (status === 'PRESENT' || status === 'HALF_DAY') && outH != null
          ? istAt(2026, 4, d, outH, outM)
          : null;
      const workHours = hoursBetween(clockIn, clockOut);

      await prisma.attendanceRecord.upsert({
        where: {
          userId_date: { userId: user.id, date },
        },
        update: {
          clockIn,
          clockOut,
          workHours,
          status,
          isManual: false,
        },
        create: {
          userId: user.id,
          companyId,
          date,
          clockIn,
          clockOut,
          workHours,
          status,
          isManual: false,
        },
      });
    }
  }

  const totalRecords = await prisma.attendanceRecord.count();
  console.log('Attendance records (total in DB):', totalRecords);

  console.log('\n--- Seed done ---\n');
  console.log('Super Admin:  superadmin@platform.com  /  super123');
  console.log('\nNakshatra Infotech (@nakshatrainfotech.co.in):');
  console.log('  Admin/HR/emp: raghav.iyer@, kavya.reddy@, vikram.mehta@, ananya.shah@, rohan.kulkarni@  /  admin123, hr123, emp123');
  console.log('\nArvind Engineering (@arvindengineering.co.in):');
  console.log('  suresh.patel@, deepa.nair@, priya.desai@, karan.thakur@  /  same pattern');
  console.log('\nMeera Healthcare (@meerahealthcare.co.in):');
  console.log('  anil.bose@, lakshmi.menon@, aditi.rao@, siddharth.mukherjee@, neha.bansal@  /  same');
  console.log('\nAttendance sample: 20–26 Apr 2026 (IST), mixed PRESENT / HALF_DAY / ABSENT / ON_LEAVE');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
