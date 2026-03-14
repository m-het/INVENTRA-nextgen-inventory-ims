const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ConflictError } = require('../../shared/errors');

const prisma = new PrismaClient();

async function list() {
  return prisma.supplier.findMany({
    orderBy: { name: 'asc' },
  });
}

async function getById(id) {
  const sup = await prisma.supplier.findUnique({
    where: { id },
    include: { purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });
  if (!sup) throw new NotFoundError('Supplier not found');
  return sup;
}

async function create(data) {
  if (data.code) {
    const existing = await prisma.supplier.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictError('Supplier code already exists');
  }
  return prisma.supplier.create({ data });
}

async function update(id, data) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Supplier not found');
  if (data.code && data.code !== existing.code) {
    const conflict = await prisma.supplier.findUnique({ where: { code: data.code } });
    if (conflict) throw new ConflictError('Supplier code already exists');
  }
  return prisma.supplier.update({ where: { id }, data });
}

async function remove(id) {
  const existing = await prisma.supplier.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Supplier not found');
  return prisma.supplier.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
