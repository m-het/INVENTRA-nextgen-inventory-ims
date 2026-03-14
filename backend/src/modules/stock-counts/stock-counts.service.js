const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const stockService = require('../warehouses/stock.service');

const prisma = new PrismaClient();

async function list(filters = {}) {
  const where = {};
  if (filters.locationId) where.locationId = filters.locationId;
  if (filters.status) where.status = filters.status;
  const list = await prisma.stockCount.findMany({
    where,
    include: {
      location: { select: { id: true, code: true, name: true } },
      countedBy: { select: { id: true, email: true, name: true } },
      lines: { include: { product: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? parseInt(filters.limit, 10) : 50,
    skip: filters.offset ? parseInt(filters.offset, 10) : 0,
  });
  return list;
}

async function getById(id) {
  const sc = await prisma.stockCount.findUnique({
    where: { id },
    include: {
      location: true,
      countedBy: true,
      lines: { include: { product: true, bin: true } },
    },
  });
  if (!sc) throw new NotFoundError('Stock count not found');
  return sc;
}

async function create(data, userId) {
  const location = await prisma.warehouse.findUnique({ where: { id: data.locationId } });
  if (!location) throw new NotFoundError('Location not found');
  const sc = await prisma.stockCount.create({
    data: {
      locationId: data.locationId,
      status: 'DRAFT',
      countedById: userId,
    },
  });
  return getById(sc.id);
}

async function addLines(countId, productIdsOrLines) {
  const sc = await prisma.stockCount.findUnique({ where: { id: countId } });
  if (!sc) throw new NotFoundError('Stock count not found');
  if (sc.status !== 'DRAFT') throw new ValidationError('Can only add lines to DRAFT count');
  const lines = productIdsOrLines.map((p) =>
    typeof p === 'string' ? { productId: p, binId: null } : { productId: p.productId, binId: p.binId || null }
  );
  const added = [];
  for (const { productId, binId } of lines) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) continue;
    const level = await stockService.getLevel(productId, sc.locationId, binId || null);
    const systemQty = level ? level.quantity : 0;
    const existing = await prisma.stockCountLine.findFirst({
      where: { stockCountId: countId, productId, binId: binId || null },
    });
    if (existing) continue;
    const line = await prisma.stockCountLine.create({
      data: { stockCountId: countId, productId, binId: binId || null, systemQuantity: systemQty },
      include: { product: true },
    });
    added.push(line);
  }
  return getById(countId);
}

async function submitLines(countId, linesUpdate, userId) {
  const sc = await prisma.stockCount.findUnique({ where: { id: countId }, include: { lines: true } });
  if (!sc) throw new NotFoundError('Stock count not found');
  if (sc.status === 'COMPLETED') throw new ValidationError('Stock count already completed');
  if (sc.status === 'DRAFT') {
    await prisma.stockCount.update({ where: { id: countId }, data: { status: 'IN_PROGRESS', countedById: userId, countedAt: new Date() } });
  }
  for (const { lineId, countedQuantity } of linesUpdate) {
    const line = sc.lines.find((l) => l.id === lineId);
    if (!line) continue;
    const variance = countedQuantity != null ? countedQuantity - line.systemQuantity : null;
    await prisma.stockCountLine.update({
      where: { id: lineId },
      data: { countedQuantity, variance, countedAt: new Date() },
    });
  }
  return getById(countId);
}

async function complete(countId, userId) {
  const sc = await prisma.stockCount.findUnique({
    where: { id: countId },
    include: { lines: { include: { product: true } } },
  });
  if (!sc) throw new NotFoundError('Stock count not found');
  if (sc.status === 'COMPLETED') throw new ValidationError('Stock count already completed');
  for (const line of sc.lines) {
    if (line.countedQuantity == null) continue;
    const variance = line.countedQuantity - line.systemQuantity;
    if (variance === 0) continue;
    await stockService.upsertLevel(line.productId, sc.locationId, variance, line.binId || null);
    await prisma.stockMovement.create({
      data: {
        type: 'ADJUSTMENT',
        productId: line.productId,
        toLocationId: sc.locationId,
        quantity: variance,
        referenceType: 'STOCK_COUNT',
        referenceId: countId,
        createdById: userId,
        notes: `Cycle count variance: ${variance}`,
      },
    });
  }
  await prisma.stockCount.update({
    where: { id: countId },
    data: { status: 'COMPLETED', completedAt: new Date(), countedById: userId },
  });
  return getById(countId);
}

module.exports = { list, getById, create, addLines, submitLines, complete };
