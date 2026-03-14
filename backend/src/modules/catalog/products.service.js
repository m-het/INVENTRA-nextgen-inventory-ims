const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ConflictError } = require('../../shared/errors');
const movementsService = require('../movements/movements.service');

const prisma = new PrismaClient();

async function list(filters = {}) {
  const where = {};
  if (filters.categoryId) where.categoryId = filters.categoryId;
  // lowStock filtered in memory after fetch
  if (filters.search) {
    where.OR = [
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
      { barcode: { equals: filters.search } },
    ];
  }
  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, code: true } },
      stockLevels: { include: { location: true } },
    },
    orderBy: { name: 'asc' },
    take: filters.limit ? parseInt(filters.limit, 10) : 100,
    skip: filters.offset ? parseInt(filters.offset, 10) : 0,
  });
  if (filters.lowStock === 'true') {
    return products.filter((p) => {
      const total = p.stockLevels.reduce((s, l) => s + l.quantity, 0);
      return p.reorderLevel > 0 && total <= p.reorderLevel;
    });
  }
  return products;
}

async function getById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true, stockLevels: { include: { location: true, bin: true } } },
  });
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

async function getBySku(sku) {
  const product = await prisma.product.findUnique({
    where: { sku },
    include: { category: true, stockLevels: { include: { location: true } } },
  });
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

async function getByBarcode(code) {
  const product = await prisma.product.findUnique({
    where: { barcode: code },
    include: { category: true, stockLevels: { include: { location: true } } },
  });
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

async function create(data, userId) {
  const { initialStock, initialWarehouseId, ...productData } = data;
  const existingSku = await prisma.product.findUnique({ where: { sku: productData.sku } });
  if (existingSku) throw new ConflictError('SKU already exists');
  if (productData.barcode) {
    const existingBarcode = await prisma.product.findUnique({ where: { barcode: productData.barcode } });
    if (existingBarcode) throw new ConflictError('Barcode already exists');
  }
  
  const product = await prisma.product.create({
    data: {
      ...productData,
      reorderLevel: productData.reorderLevel ?? 0,
    },
  });

  if (initialStock > 0 && initialWarehouseId) {
    await movementsService.create({
      type: 'ADJUSTMENT',
      productId: product.id,
      toLocationId: initialWarehouseId,
      quantity: initialStock,
      notes: 'Initial stock setup',
    }, userId);
  }

  return getById(product.id);
}

async function update(id, data) {
  const { initialStock, initialWarehouseId, ...updateData } = data;
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product not found');
  if (updateData.sku && updateData.sku !== existing.sku) {
    const conflict = await prisma.product.findUnique({ where: { sku: updateData.sku } });
    if (conflict) throw new ConflictError('SKU already exists');
  }
  if (updateData.barcode != null && updateData.barcode !== existing.barcode) {
    const conflict = await prisma.product.findFirst({ where: { barcode: updateData.barcode } });
    if (conflict) throw new ConflictError('Barcode already exists');
  }
  return prisma.product.update({ where: { id }, data: updateData });
}

async function remove(id) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Product not found');
  return prisma.product.delete({ where: { id } });
}

module.exports = { list, getById, getBySku, getByBarcode, create, update, remove };
