const logger = require('../config/logger');
const { AppError } = require('../shared/errors');

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    const body = { message: err.message, code: err.code };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Invalid or expired token', code: 'UNAUTHORIZED' });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ message: 'Resource already exists', code: 'CONFLICT', field: err.meta?.target?.[0] });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ message: 'Record not found', code: 'NOT_FOUND' });
  }

  logger.error({ err, req: { method: req.method, url: req.url } }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error', code: 'INTERNAL_ERROR' });
}

module.exports = errorHandler;
