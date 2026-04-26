import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';
import prisma from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user with role
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account is deactivated', 401);
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role.name,
      companyId: user.companyId,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

export const requireCompanyAccess = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Not authenticated', 401);
  }

  // Super Admin can access any company
  if (req.user.role === 'SUPER_ADMIN') {
    return next();
  }

  // Other users must have a company
  if (!req.user.companyId) {
    return errorResponse(res, 'No company assigned', 403);
  }

  next();
};
