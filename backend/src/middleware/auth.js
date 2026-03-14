const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { UnauthorizedError } = require('../shared/errors');
const config = require('../config');

const prisma = new PrismaClient();

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing or invalid Authorization header'));
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, name: true },
    });
    if (!user) return next(new UnauthorizedError('User not found'));
    req.user = user;
    next();
  } catch (e) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

module.exports = { authMiddleware };
