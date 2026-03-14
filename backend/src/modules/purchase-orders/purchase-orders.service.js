const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ConflictError, ValidationError } = require('../../shared/errors');

const prisma = new PrismaClient();

function generateOrderNumber() {
  return 'PO-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

async function list(filters = {}) {
  const where = {};
  if (filters.supplierId) where.supplierId = filters.supplierId;
  if (filters.status) where.status = filters.status;
  const list = await prisma.purchaseOrder.findMany({
    where,
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      lines: { include: { product: { select: { id: true, sku: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? parseInt(filters.limit, 10) : 50,
    skip: filters.offset ? parseInt(filters.offset, 10) : 0,
  });
  return list;
}

async function getById(id) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      lines: { include: { product: true } },
      grns: true,
    },
  });
  if (!po) throw new NotFoundError('Purchase order not found');
  return po;
}

async function create(data, userId) {
  const supplier = await prisma.supplier.findUnique({ where: { id: data.supplierId } });
  if (!supplier) throw new NotFoundError('Supplier not found');
  const orderNumber = data.orderNumber || generateOrderNumber();
  const existing = await prisma.purchaseOrder.findUnique({ where: { orderNumber } });
  if (existing) throw new ConflictError('Order number already exists');
  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId: data.supplierId,
      status: data.status || 'DRAFT',
      orderNumber,
      orderedAt: data.orderedAt ? new Date(data.orderedAt) : null,
      expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
      createdById: userId,
    },
  });
  if (data.lines && data.lines.length > 0) {
    for (const line of data.lines) {
      await prisma.pOLine.create({
        data: {
          poId: po.id,
          productId: line.productId,
          quantityOrdered: line.quantityOrdered,
          unitPrice: line.unitPrice != null ? line.unitPrice : null,
        },
      });
    }
  }
  return getById(po.id);
}

async function update(id, data) {
  const existing = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError('Purchase order not found');
  if (existing.status !== 'DRAFT') throw new ValidationError('Only DRAFT PO can be updated');
  const updateData = {};
  if (data.status != null) updateData.status = data.status;
  if (data.orderedAt != null) updateData.orderedAt = new Date(data.orderedAt);
  if (data.expectedAt != null) updateData.expectedAt = new Date(data.expectedAt);
  await prisma.purchaseOrder.update({ where: { id }, data: updateData });
  if (data.lines && data.lines.length > 0) {
    await prisma.pOLine.deleteMany({ where: { poId: id } });
    for (const line of data.lines) {
      await prisma.pOLine.create({
        data: {
          poId: id,
          productId: line.productId,
          quantityOrdered: line.quantityOrdered,
          unitPrice: line.unitPrice != null ? line.unitPrice : null,
        },
      });
    }
  }
  return getById(id);
}

async function addLine(poId, line) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) throw new NotFoundError('Purchase order not found');
  if (po.status !== 'DRAFT') throw new ValidationError('Can only add lines to DRAFT PO');
  const product = await prisma.product.findUnique({ where: { id: line.productId } });
  if (!product) throw new NotFoundError('Product not found');
  return prisma.pOLine.create({
    data: {
      poId,
      productId: line.productId,
      quantityOrdered: line.quantityOrdered,
      unitPrice: line.unitPrice != null ? line.unitPrice : null,
    },
    include: { product: true },
  });
}

module.exports = { list, getById, create, update, addLine };
