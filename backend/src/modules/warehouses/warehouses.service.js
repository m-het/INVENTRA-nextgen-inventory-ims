const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ConflictError } = require('../../shared/errors');

const prisma = new PrismaClient();

async function list() {
  return prisma.warehouse.findMany({
    include: { bins: true },
    orderBy: { code: 'asc' },
  });
}

async function getById(id) {
  const wh = await prisma.warehouse.findUnique({
    where: { id },
    include: { bins: true },
  });
  if (!wh) throw new NotFoundError('Warehouse not found');
  return wh;
}

async function create(data) {
  const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
  if (existing) throw new ConflictError('Warehouse code already exists');
  return prisma.warehouse.create({ data });
}

async function update(id, data) {
  const existing = await prisma.warehouse.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Warehouse not found');
  if (data.code && data.code !== existing.code) {
    const conflict = await prisma.warehouse.findUnique({ where: { code: data.code } });
    if (conflict) throw new ConflictError('Warehouse code already exists');
  }
  return prisma.warehouse.update({ where: { id }, data });
}

async function remove(id) {
  const existing = await prisma.warehouse.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Warehouse not found');
  return prisma.warehouse.delete({ where: { id } });
}

async function listBins(warehouseId) {
  const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!wh) throw new NotFoundError('Warehouse not found');
  return prisma.bin.findMany({
    where: { warehouseId },
    orderBy: { code: 'asc' },
  });
}

async function createBin(warehouseId, data) {
  const wh = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
  if (!wh) throw new NotFoundError('Warehouse not found');
  const existing = await prisma.bin.findUnique({
    where: { warehouseId_code: { warehouseId, code: data.code } },
  });
  if (existing) throw new ConflictError('Bin code already exists in this warehouse');
  return prisma.bin.create({ data: { ...data, warehouseId } });
}

module.exports = { list, getById, create, update, remove, listBins, createBin };
