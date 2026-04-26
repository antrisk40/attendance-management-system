import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create roles
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

  console.log('Roles created:', roles.map((r) => r.name).join(', '));

  // Create company
  const company = await prisma.company.upsert({
    where: { slug: 'acme-corp' },
    update: {},
    create: {
      name: 'Acme Corporation',
      slug: 'acme-corp',
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

  console.log('Company created:', company.name);

  // Hash passwords
  const superAdminPassword = await bcrypt.hash('super123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const hrPassword = await bcrypt.hash('hr123', 10);
  const empPassword = await bcrypt.hash('emp123', 10);

  // Create Super Admin (no company)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@platform.com' },
    update: {},
    create: {
      email: 'superadmin@platform.com',
      password: superAdminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: roles.find((r) => r.name === 'SUPER_ADMIN').id,
      isActive: true,
    },
  });

  console.log('Super Admin created:', superAdmin.email);

  // Create company users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@company.com' },
    update: {},
    create: {
      email: 'admin@company.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: roles.find((r) => r.name === 'ADMIN').id,
      companyId: company.id,
      isActive: true,
    },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hr@company.com' },
    update: {},
    create: {
      email: 'hr@company.com',
      password: hrPassword,
      firstName: 'HR',
      lastName: 'Manager',
      roleId: roles.find((r) => r.name === 'HR').id,
      companyId: company.id,
      isActive: true,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: 'john@company.com' },
    update: {},
    create: {
      email: 'john@company.com',
      password: empPassword,
      firstName: 'John',
      lastName: 'Doe',
      roleId: roles.find((r) => r.name === 'EMPLOYEE').id,
      companyId: company.id,
      isActive: true,
    },
  });

  console.log('Company users created:', admin.email, hr.email, employee.email);

  // Create another employee for testing
  const employee2 = await prisma.user.upsert({
    where: { email: 'jane@company.com' },
    update: {},
    create: {
      email: 'jane@company.com',
      password: empPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      roleId: roles.find((r) => r.name === 'EMPLOYEE').id,
      companyId: company.id,
      isActive: true,
    },
  });

  console.log('Additional employee created:', employee2.email);

  console.log('\nSeed completed successfully!');
  console.log('\nLogin credentials:');
  console.log('Super Admin: superadmin@platform.com / super123');
  console.log('Admin:       admin@company.com / admin123');
  console.log('HR:          hr@company.com / hr123');
  console.log('Employee 1:  john@company.com / emp123');
  console.log('Employee 2:  jane@company.com / emp123');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
