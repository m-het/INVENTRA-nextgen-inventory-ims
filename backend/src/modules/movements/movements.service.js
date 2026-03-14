const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const stockService = require('../warehouses/stock.service');

const prisma = new PrismaClient();

const MovementType = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
};

async function create(data, userId) {
  const { type, productId, fromLocationId, toLocationId, quantity, referenceType, referenceId, notes } = data;
  if (!productId || quantity === 0) throw new ValidationError('Invalid product or quantity');
  if (type !== 'ADJUSTMENT' && quantity <= 0) throw new ValidationError('Quantity must be positive for this movement type');

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new NotFoundError('Product not found');

  let fromLoc = null;
  let toLoc = null;
  if (fromLocationId) {
    fromLoc = await prisma.warehouse.findUnique({ where: { id: fromLocationId } });
    if (!fromLoc) throw new NotFoundError('From location not found');
  }
  if (toLocationId) {
    toLoc = await prisma.warehouse.findUnique({ where: { id: toLocationId } });
    if (!toLoc) throw new NotFoundError('To location not found');
  }

  switch (type) {
    case MovementType.INBOUND:
      if (!toLocationId) throw new ValidationError('To location required for INBOUND');
      await stockService.upsertLevel(productId, toLocationId, quantity, null);
      break;
    case MovementType.OUTBOUND:
      if (!fromLocationId) throw new ValidationError('From location required for OUTBOUND');
      await stockService.upsertLevel(productId, fromLocationId, -quantity, null);
      break;
    case MovementType.TRANSFER:
      if (!fromLocationId || !toLocationId) throw new ValidationError('From and to location required for TRANSFER');
      await stockService.upsertLevel(productId, fromLocationId, -quantity, null);
      await stockService.upsertLevel(productId, toLocationId, quantity, null);
      break;
    case MovementType.ADJUSTMENT: {
      if (!toLocationId && !fromLocationId) throw new ValidationError('Location required for ADJUSTMENT');
      const locId = toLocationId || fromLocationId;
      await stockService.upsertLevel(productId, locId, quantity, null); // quantity can be +/- for adjustment
      break;
    }
    default:
      throw new ValidationError('Invalid movement type');
  }

  const movement = await prisma.stockMovement.create({
    data: {
      type,
      productId,
      fromLocationId: fromLocationId || null,
      toLocationId: toLocationId || null,
      quantity,
      referenceType: referenceType || null,
      referenceId: referenceId || null,
      createdById: userId,
      notes: notes || null,
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      fromLocation: { select: { id: true, code: true, name: true } },
      toLocation: { select: { id: true, code: true, name: true } },
    },
  });
  return movement;
}

async function list(filters = {}) {
  const where = {};
  if (filters.productId) where.productId = filters.productId;
  if (filters.locationId || filters.warehouseId) {
    const locId = filters.locationId || filters.warehouseId;
    where.OR = [
      { fromLocationId: locId },
      { toLocationId: locId },
    ];
  }
  if (filters.type) where.type = filters.type;
  if (filters.categoryId) where.product = { categoryId: filters.categoryId };
  if (filters.fromDate) where.createdAt = { ...where.createdAt, gte: new Date(filters.fromDate) };
  if (filters.toDate) where.createdAt = { ...where.createdAt, lte: new Date(filters.toDate) };

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { id: true, sku: true, name: true } },
      fromLocation: { select: { id: true, code: true, name: true } },
      toLocation: { select: { id: true, code: true, name: true } },
      createdBy: { select: { id: true, email: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? parseInt(filters.limit, 10) : 50,
    skip: filters.offset ? parseInt(filters.offset, 10) : 0,
  });
  return movements;
}

module.exports = { create, list };
