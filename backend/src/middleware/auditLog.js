import prisma from '../config/database.js';

export const auditLog = (action, entityType, getEntityId) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      // Restore original function
      res.json = originalJson;

      try {
        // Only log successful operations
        if (data.success !== false && req.user) {
          const entityId = getEntityId ? getEntityId(req, data) : req.params.id || 'N/A';
          const companyId = req.user.companyId || req.params.companyId || data.data?.companyId;

          await prisma.auditLog.create({
            data: {
              userId: req.user.id,
              companyId: companyId || 'system',
              action,
              entityType,
              entityId: entityId || 'N/A',
              oldValue: req.body ? JSON.stringify(req.body) : null,
              newValue: data.data ? JSON.stringify(data.data) : null,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });
        }
      } catch (error) {
        console.error('Audit log error:', error);
      }

      return originalJson(data);
    };

    next();
  };
};
