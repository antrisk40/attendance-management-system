/**
 * One-time (or re-runnable) email migration: move legacy seed addresses to
 * professional Indian corporate format: firstname.lastname@companydomain.co.in
 *
 * Run: npm run seed2
 * Safe: skips if `from` user missing or `to` already taken
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** @type {{ from: string; to: string }[]} */
const EMAIL_MIGRATIONS = [
  // Nakshatra Infotech
  { from: 'admin@nakshatra.inf', to: 'raghav.iyer@nakshatrainfotech.co.in' },
  { from: 'hr@nakshatra.inf', to: 'kavya.reddy@nakshatrainfotech.co.in' },
  { from: 'vikram.m@nakshatra.inf', to: 'vikram.mehta@nakshatrainfotech.co.in' },
  { from: 'ananya.s@nakshatra.inf', to: 'ananya.shah@nakshatrainfotech.co.in' },
  { from: 'rohan.k@nakshatra.inf', to: 'rohan.kulkarni@nakshatrainfotech.co.in' },
  // Arvind Engineering
  { from: 'admin@arvind.eng', to: 'suresh.patel@arvindengineering.co.in' },
  { from: 'hr@arvind.eng', to: 'deepa.nair@arvindengineering.co.in' },
  { from: 'priya.d@arvind.eng', to: 'priya.desai@arvindengineering.co.in' },
  { from: 'karan.t@arvind.eng', to: 'karan.thakur@arvindengineering.co.in' },
  // Meera Healthcare
  { from: 'admin@meera.care', to: 'anil.bose@meerahealthcare.co.in' },
  { from: 'hr@meera.care', to: 'lakshmi.menon@meerahealthcare.co.in' },
  { from: 'aditi.r@meera.care', to: 'aditi.rao@meerahealthcare.co.in' },
  { from: 'siddharth.m@meera.care', to: 'siddharth.mukherjee@meerahealthcare.co.in' },
  { from: 'neha.b@meera.care', to: 'neha.bansal@meerahealthcare.co.in' },
];

async function main() {
  console.log('seed2: migrating company user emails to firstname.lastname@company.co.in format...\n');

  for (const { from, to } of EMAIL_MIGRATIONS) {
    if (from === to) continue;

    const existing = await prisma.user.findUnique({ where: { email: from } });
    if (!existing) {
      const atTarget = await prisma.user.findUnique({ where: { email: to } });
      if (atTarget) {
        console.log(`[skip] ${to} (already in use; old ${from} not found — likely already migrated)`);
      } else {
        console.log(`[skip] no user with ${from}`);
      }
      continue;
    }

    const targetTaken = await prisma.user.findUnique({ where: { email: to } });
    if (targetTaken && targetTaken.id !== existing.id) {
      console.log(`[skip] cannot move ${from} -> ${to} (email already on another user)`);
      continue;
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { email: to },
    });
    console.log(`[ok] ${from}  →  ${to}`);
  }

  console.log('\nDone. Re-run is safe: old addresses will be “not found” after first run.');
}

main()
  .catch((e) => {
    console.error('seed2 failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
 