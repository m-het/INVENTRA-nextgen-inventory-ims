const { ForbiddenError } = require('../shared/errors');
const { can } = require('../shared/permissions');

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return next(new ForbiddenError('Not authenticated'));
    if (can(req.user.role, permission)) return next();
    next(new ForbiddenError('Insufficient permissions'));
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ForbiddenError('Not authenticated'));
    if (roles.includes(req.user.role)) return next();
    next(new ForbiddenError('Insufficient permissions'));
  };
}

module.exports = { requirePermission, requireRole };
