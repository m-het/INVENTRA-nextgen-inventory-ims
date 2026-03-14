const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ConflictError } = require('../../shared/errors');

const prisma = new PrismaClient();

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function list(userId, role) {
  const select = { id: true, email: true, name: true, role: true, createdAt: true };
  if (role === 'INVENTORY_MANAGER') {
    return prisma.user.findMany({ select, orderBy: { createdAt: 'desc' } });
  }
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!me) throw new NotFoundError('User not found');
  return [await getMe(userId)];
}

async function updateMe(userId, data) {
  const { password, ...rest } = data;
  const update = { ...rest };
  if (password && password.length >= 6) {
    update.passwordHash = await bcrypt.hash(password, 10);
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: update,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
  return user;
}

async function updateUser(adminUserId, targetId, data) {
  const existing = await prisma.user.findUnique({ where: { id: targetId } });
  if (!existing) throw new NotFoundError('User not found');
  if (data.email && data.email !== existing.email) {
    const conflict = await prisma.user.findUnique({ where: { email: data.email } });
    if (conflict) throw new ConflictError('Email already in use');
  }
  const { password, ...rest } = data;
  const update = { ...rest };
  if (password && password.length >= 6) {
    update.passwordHash = await bcrypt.hash(password, 10);
  }
  return prisma.user.update({
    where: { id: targetId },
    data: update,
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

module.exports = { getMe, list, updateMe, updateUser };
