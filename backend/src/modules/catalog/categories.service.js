const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ConflictError } = require('../../shared/errors');

const prisma = new PrismaClient();

async function list() {
  return prisma.category.findMany({
    include: { parent: { select: { id: true, name: true, code: true } } },
    orderBy: { name: 'asc' },
  });
}

async function getById(id) {
  const cat = await prisma.category.findUnique({
    where: { id },
    include: { parent: true, children: true, products: { select: { id: true, sku: true, name: true } } },
  });
  if (!cat) throw new NotFoundError('Category not found');
  return cat;
}

async function create(data) {
  if (data.code) {
    const existing = await prisma.category.findUnique({ where: { code: data.code } });
    if (existing) throw new ConflictError('Category code already exists');
  }
  return prisma.category.create({ data });
}

async function update(id, data) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Category not found');
  if (data.code && data.code !== existing.code) {
    const conflict = await prisma.category.findUnique({ where: { code: data.code } });
    if (conflict) throw new ConflictError('Category code already exists');
  }
  return prisma.category.update({ where: { id }, data });
}

async function remove(id) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Category not found');
  return prisma.category.delete({ where: { id } });
}

module.exports = { list, getById, create, update, remove };
