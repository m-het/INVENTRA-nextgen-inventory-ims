const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function list(filters = {}) {
  const where = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.action) where.action = filters.action;
  if (filters.fromDate) where.createdAt = { ...where.createdAt, gte: new Date(filters.fromDate) };
  if (filters.toDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.toDate) };
  const list = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? parseInt(filters.limit, 10) : 50,
    skip: filters.offset ? parseInt(filters.offset, 10) : 0,
  });
  return list;
}

module.exports = { list };
