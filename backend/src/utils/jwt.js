import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
const ACCESS_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '15m';
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRATION });
  const refreshToken = jwt.sign(
    { id: payload.id, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRATION }
  );
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

export const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRATION });
};
