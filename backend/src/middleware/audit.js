const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditLog(userId, action, entityType, entityId, oldValue, newValue, req = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || undefined,
        action,
        entityType,
        entityId: entityId || undefined,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
        ip: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get?.('user-agent'),
      },
    });
  } catch (e) {
    console.error('Audit log failed', e);
  }
}

module.exports = { auditLog };
