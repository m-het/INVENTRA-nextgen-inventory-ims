const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ValidationError } = require('../../shared/errors');

const prisma = new PrismaClient();

async function getLevels(filters = {}) {
  const where = {};
  if (filters.productId) where.productId = filters.productId;
  if (filters.locationId) where.locationId = filters.locationId;
  if (filters.warehouseId) where.locationId = filters.warehouseId;
  const levels = await prisma.stockLevel.findMany({
    where,
    include: {
      product: { select: { id: true, sku: true, name: true, reorderLevel: true } },
      location: { select: { id: true, code: true, name: true } },
      bin: { select: { id: true, code: true, name: true } },
    },
  });
  return levels;
}

async function getLevel(productId, locationId, binId = null) {
  const level = await prisma.stockLevel.findUnique({
    where: {
      productId_locationId_binId: {
        productId,
        locationId,
        binId: binId || null,
      },
    },
    include: {
      product: true,
      location: true,
      bin: true,
    },
  });
  return level;
}

async function upsertLevel(productId, locationId, quantityDelta, binId = null) {
  const key = { productId, locationId, binId: binId || null };
  const existing = await prisma.stockLevel.findUnique({
    where: { productId_locationId_binId: key },
  });
  const newQty = (existing?.quantity ?? 0) + quantityDelta;
  if (newQty < 0) throw new ValidationError('Insufficient stock');
  if (existing) {
    return prisma.stockLevel.update({
      where: { productId_locationId_binId: key },
      data: { quantity: newQty },
      include: { product: true, location: true, bin: true },
    });
  }
  if (newQty <= 0) return null;
  return prisma.stockLevel.create({
    data: { ...key, quantity: newQty },
    include: { product: true, location: true, bin: true },
  });
}

module.exports = { getLevels, getLevel, upsertLevel };
