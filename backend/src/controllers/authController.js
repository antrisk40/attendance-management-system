import { z } from 'zod';
import { successResponse, errorResponse } from '../utils/response.js';
import {
  loginWithEmailPassword,
  refreshAccessToken,
  logoutRefreshToken,
  logoutAllForUser,
  getProfileByUserId,
} from '../services/authService.js';

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const login = async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const data = await loginWithEmailPassword({ email, password });
  return successResponse(res, data, 'Login successful');
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const data = await refreshAccessToken({ refreshToken });
    return successResponse(res, data, 'Token refreshed');
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Invalid refresh token', 401);
    }
    throw error;
  }
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  await logoutRefreshToken({ refreshToken });
  return successResponse(res, null, 'Logout successful');
};

export const logoutAll = async (req, res) => {
  await logoutAllForUser({ userId: req.user.id });
  return successResponse(res, null, 'Logged out from all devices');
};

export const getProfile = async (req, res) => {
  const user = await getProfileByUserId({ userId: req.user.id });
  return successResponse(res, user, 'Profile retrieved');
};
