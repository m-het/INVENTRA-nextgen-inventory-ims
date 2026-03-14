const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const stockService = require('../warehouses/stock.service');

const prisma = new PrismaClient();

async function list(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  const list = await prisma.pickList.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, email: true, name: true } },
      lines: { include: { product: true, bin: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? parseInt(filters.limit, 10) : 50,
    skip: filters.offset ? parseInt(filters.offset, 10) : 0,
  });
  return list;
}

async function getById(id) {
  const pl = await prisma.pickList.findUnique({
    where: { id },
    include: {
      assignedTo: true,
      lines: { include: { product: true, bin: true } },
    },
  });
  if (!pl) throw new NotFoundError('Pick list not found');
  return pl;
}

async function create(data, userId) {
  const lines = data.lines || [];
  if (lines.length === 0) throw new ValidationError('At least one line required');
  for (const l of lines) {
    const product = await prisma.product.findUnique({ where: { id: l.productId } });
    if (!product) throw new NotFoundError(`Product ${l.productId} not found`);
  }
  const pl = await prisma.pickList.create({
    data: {
      orderRef: data.orderRef || null,
      status: 'PENDING',
      assignedToId: data.assignedToId || userId,
      lines: {
        create: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          binId: l.binId || null,
        })),
      },
    },
    include: { lines: { include: { product: true } } },
  });
  return pl;
}

async function pick(pickListId, lineId, quantityPicked, userId) {
  const pl = await prisma.pickList.findUnique({ where: { id: pickListId }, include: { lines: true } });
  if (!pl) throw new NotFoundError('Pick list not found');
  if (pl.status === 'DISPATCHED') throw new ValidationError('Pick list already dispatched');
  const line = pl.lines.find((l) => l.id === lineId);
  if (!line) throw new NotFoundError('Pick list line not found');
  if (quantityPicked < 0 || quantityPicked > line.quantity) throw new ValidationError('Invalid quantity picked');
  await prisma.pickListLine.update({
    where: { id: lineId },
    data: { quantityPicked },
  });
  await prisma.pickList.update({
    where: { id: pickListId },
    data: { status: 'IN_PROGRESS' },
  });
  return getById(pickListId);
}

async function dispatch(pickListId, userId) {
  const pl = await prisma.pickList.findUnique({
    where: { id: pickListId },
    include: { lines: { include: { product: true, bin: true } } },
  });
  if (!pl) throw new NotFoundError('Pick list not found');
  if (pl.status === 'DISPATCHED') throw new ValidationError('Pick list already dispatched');
  const warehouseId = pl.lines[0]?.bin?.warehouseId;
  let defaultLocationId = null;
  if (!warehouseId) {
    const wh = await prisma.warehouse.findFirst();
    if (wh) defaultLocationId = wh.id;
  }
  for (const line of pl.lines) {
    const qty = line.quantityPicked || line.quantity;
    if (qty <= 0) continue;
    const locationId = line.bin?.warehouseId || defaultLocationId;
    if (!locationId) throw new ValidationError('No warehouse/location for dispatch');
    await stockService.upsertLevel(line.productId, locationId, -qty, line.binId || null);
    await prisma.stockMovement.create({
      data: {
        type: 'OUTBOUND',
        productId: line.productId,
        fromLocationId: locationId,
        quantity: qty,
        referenceType: 'PICK_LIST',
        referenceId: pickListId,
        createdById: userId,
      },
    });
  }
  await prisma.pickList.update({
    where: { id: pickListId },
    data: { status: 'DISPATCHED', dispatchedAt: new Date() },
  });
  return getById(pickListId);
}

module.exports = { list, getById, create, pick, dispatch };
