const { PrismaClient } = require('@prisma/client');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const stockService = require('../warehouses/stock.service');

const prisma = new PrismaClient();

async function list(filters = {}) {
  const where = {};
  if (filters.poId) where.poId = filters.poId;
  if (filters.status) where.status = filters.status;
  const list = await prisma.grn.findMany({
    where,
    include: {
      po: { include: { supplier: { select: { id: true, name: true } } } },
      receivedBy: { select: { id: true, email: true, name: true } },
      lines: { include: { product: true, bin: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit ? parseInt(filters.limit, 10) : 50,
    skip: filters.offset ? parseInt(filters.offset, 10) : 0,
  });
  return list;
}

async function getById(id) {
  const grn = await prisma.grn.findUnique({
    where: { id },
    include: {
      po: { include: { supplier: true, lines: { include: { product: true } } } },
      receivedBy: true,
      lines: { include: { product: true, bin: true } },
    },
  });
  if (!grn) throw new NotFoundError('GRN not found');
  return grn;
}

async function createFromPo(poId, userId) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { lines: { include: { product: true } } },
  });
  if (!po) throw new NotFoundError('Purchase order not found');
  if (po.status === 'CANCELLED') throw new ValidationError('Cannot create GRN for cancelled PO');
  const grn = await prisma.grn.create({
    data: {
      poId,
      receivedById: userId,
      status: 'DRAFT',
    },
  });
  for (const line of po.lines) {
    await prisma.grnLine.create({
      data: {
        grnId: grn.id,
        productId: line.productId,
        quantityExpected: line.quantityOrdered - line.quantityReceived,
        quantityReceived: 0,
      },
    });
  }
  return getById(grn.id);
}

async function updateLine(grnId, lineId, data) {
  const grn = await prisma.grn.findUnique({ where: { id: grnId } });
  if (!grn) throw new NotFoundError('GRN not found');
  if (grn.status !== 'DRAFT') throw new ValidationError('Can only update lines of DRAFT GRN');
  const line = await prisma.grnLine.findFirst({ where: { id: lineId, grnId } });
  if (!line) throw new NotFoundError('GRN line not found');
  const updateData = {};
  if (data.quantityReceived != null) updateData.quantityReceived = data.quantityReceived;
  if (data.binId != null) updateData.binId = data.binId;
  await prisma.grnLine.update({ where: { id: lineId }, data: updateData });
  return getById(grnId);
}

async function shelve(grnId, lineId, binId) {
  const bin = await prisma.bin.findUnique({ where: { id: binId } });
  if (!bin) throw new NotFoundError('Bin not found');
  return updateLine(grnId, lineId, { binId });
}

async function confirm(grnId, userId) {
  const grn = await prisma.grn.findUnique({
    where: { id: grnId },
    include: { lines: true, po: true },
  });
  if (!grn) throw new NotFoundError('GRN not found');
  if (grn.status === 'CONFIRMED') throw new ValidationError('GRN already confirmed');
  let defaultWarehouseId = null;
  const firstWh = await prisma.warehouse.findFirst();
  if (firstWh) defaultWarehouseId = firstWh.id;
  if (!defaultWarehouseId && grn.lines.length > 0) throw new ValidationError('No warehouse configured. Create a warehouse first.');
  for (const line of grn.lines) {
    if (line.quantityReceived <= 0) continue;
    let locationId = defaultWarehouseId;
    if (line.binId) {
      const bin = await prisma.bin.findUnique({ where: { id: line.binId } });
      locationId = bin ? bin.warehouseId : defaultWarehouseId;
    }
    if (!locationId) continue;
    await stockService.upsertLevel(line.productId, locationId, line.quantityReceived, line.binId || null);
    await prisma.stockMovement.create({
      data: {
        type: 'INBOUND',
        productId: line.productId,
        toLocationId: locationId,
        quantity: line.quantityReceived,
        referenceType: 'GRN',
        referenceId: grn.id,
        createdById: userId,
      },
    });
    const poLine = await prisma.pOLine.findFirst({
      where: { poId: grn.poId, productId: line.productId },
    });
    if (poLine) {
      await prisma.pOLine.update({
        where: { id: poLine.id },
        data: { quantityReceived: poLine.quantityReceived + line.quantityReceived },
      });
    }
  }
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: grn.poId },
    include: { lines: true },
  });
  const allReceived = po.lines.every((l) => l.quantityReceived >= l.quantityOrdered);
  await prisma.purchaseOrder.update({
    where: { id: grn.poId },
    data: { status: allReceived ? 'RECEIVED' : 'PARTIAL_RECEIVED' },
  });
  await prisma.grn.update({
    where: { id: grnId },
    data: { status: 'CONFIRMED', receivedAt: new Date() },
  });
  return getById(grnId);
}

async function createDirectReceipt(data, userId) {
  const { supplierId, locationId, notes, lines } = data;
  if (!supplierId) throw new ValidationError('Supplier is required');
  if (!locationId) throw new ValidationError('Destination Location is required');
  if (!lines || lines.length === 0) throw new ValidationError('At least one line is required');

  const orderNumber = `PO-DIR-${Date.now()}`;
  const po = await prisma.purchaseOrder.create({
    data: {
      supplierId,
      status: 'RECEIVED',
      orderNumber,
      orderedAt: new Date(),
      createdById: userId,
      lines: {
        create: lines.map(l => ({
          productId: l.productId,
          quantityOrdered: l.quantityReceived,
          quantityReceived: l.quantityReceived,
        }))
      }
    },
    include: { lines: true }
  });

  const grn = await prisma.grn.create({
    data: {
      poId: po.id,
      status: 'CONFIRMED',
      receivedAt: new Date(),
      receivedById: userId,
      notes,
      lines: {
        create: po.lines.map(poLine => ({
          productId: poLine.productId,
          quantityExpected: poLine.quantityOrdered,
          quantityReceived: poLine.quantityReceived,
        }))
      }
    },
    include: { lines: true }
  });

  for (const line of grn.lines) {
    if (line.quantityReceived > 0) {
      await stockService.upsertLevel(line.productId, locationId, line.quantityReceived);
      
      await prisma.stockMovement.create({
        data: {
          type: 'INBOUND',
          productId: line.productId,
          toLocationId: locationId,
          quantity: line.quantityReceived,
          referenceType: 'GRN',
          referenceId: grn.id,
          createdById: userId,
        }
      });
    }
  }

  return getById(grn.id);
}

module.exports = { list, getById, createFromPo, updateLine, shelve, confirm, createDirectReceipt };
