import { errorResponse } from '../utils/response.js';

export const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return errorResponse(res, 'Duplicate entry found', 409);
      case 'P2025':
        return errorResponse(res, 'Record not found', 404);
      case 'P2003':
        return errorResponse(res, 'Foreign key constraint failed', 400);
      default:
        return errorResponse(res, 'Database error', 500);
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return errorResponse(res, 'Validation failed', 400, errors);
  }

  // Default error
  return errorResponse(
    res,
    err.message || 'Internal server error',
    err.statusCode || 500
  );
};

export const notFoundHandler = (req, res) => {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
};
