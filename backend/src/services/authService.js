import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { generateTokens, verifyRefreshToken, generateAccessToken } from '../utils/jwt.js';

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

export async function loginWithEmailPassword({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { role: true },
  });
  if (!user) throw httpError('Invalid credentials', 401);
  if (!user.isActive) throw httpError('Account is deactivated', 401);

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw httpError('Invalid credentials', 401);

  const tokens = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role.name,
    companyId: user.companyId,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
      companyId: user.companyId,
    },
    tokens,
  };
}

export async function refreshAccessToken({ refreshToken }) {
  if (!refreshToken) throw httpError('Refresh token required', 400);

  verifyRefreshToken(refreshToken);

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: { include: { role: true } } },
  });
  if (!storedToken) throw httpError('Invalid refresh token', 401);

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    throw httpError('Refresh token expired', 401);
  }

  const accessToken = generateAccessToken({
    id: storedToken.user.id,
    email: storedToken.user.email,
    role: storedToken.user.role.name,
    companyId: storedToken.user.companyId,
  });

  return { accessToken };
}

export async function logoutRefreshToken({ refreshToken }) {
  if (!refreshToken) return;
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function logoutAllForUser({ userId }) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

export async function getProfileByUserId({ userId }) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: { select: { name: true, description: true } },
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          settings: true,
        },
      },
      isActive: true,
      createdAt: true,
    },
  });
}

