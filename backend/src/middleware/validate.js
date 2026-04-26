import { errorResponse } from '../utils/response.js';

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      const errors = error.errors?.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse(res, 'Validation failed', 400, errors || error.message);
    }
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      const errors = error.errors?.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return errorResponse(res, 'Query validation failed', 400, errors || error.message);
    }
  };
};
