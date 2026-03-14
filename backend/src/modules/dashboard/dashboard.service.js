const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getKpis() {
  const productsWithStock = await prisma.product.findMany({
    include: { stockLevels: true },
  });
  let totalStockQuantity = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const p of productsWithStock) {
    const total = p.stockLevels.reduce((s, l) => s + l.quantity, 0);
    totalStockQuantity += total;
    if (p.reorderLevel > 0) {
      if (total <= 0) outOfStockCount += 1;
      else if (total <= p.reorderLevel) lowStockCount += 1;
    }
  }
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [productCount, warehouseCount, movementCountToday, pendingGrnCount, pendingPickListCount, internalTransfersScheduled] = await Promise.all([
    prisma.product.count(),
    prisma.warehouse.count(),
    prisma.stockMovement.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(),
        },
      },
    }),
    prisma.grn.count({ where: { status: 'DRAFT' } }),
    prisma.pickList.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.stockMovement.count({
      where: { type: 'TRANSFER', createdAt: { gte: sevenDaysAgo } },
    }),
  ]);
  return {
    totalProducts: productCount,
    totalProductsInStock: totalStockQuantity,
    lowStockCount,
    outOfStockCount,
    pendingReceipts: pendingGrnCount,
    pendingDeliveries: pendingPickListCount,
    internalTransfersScheduled,
    totalWarehouses: warehouseCount,
    movementsToday: movementCountToday,
  };
}

async function getAlerts() {
  const products = await prisma.product.findMany({
    where: { reorderLevel: { gt: 0 } },
    include: { stockLevels: { include: { location: true } } },
  });
  const lowStock = products
    .map((p) => {
      const total = p.stockLevels.reduce((s, l) => s + l.quantity, 0);
      return { product: p, total, reorderLevel: p.reorderLevel };
    })
    .filter(({ total, reorderLevel }) => total <= reorderLevel)
    .map(({ product, total, reorderLevel }) => ({
      type: 'LOW_STOCK',
      productId: product.id,
      sku: product.sku,
      name: product.name,
      currentQuantity: total,
      reorderLevel,
    }));
  return { alerts: lowStock };
}

const DOCUMENT_TYPES = ['Receipts', 'Delivery', 'Internal', 'Adjustments'];
const STATUSES = ['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'];

function includeByDocumentType(allowed, ...types) {
  if (!allowed) return true;
  const set = { Receipts: ['GRN', 'INBOUND'], Delivery: ['PICK_LIST', 'OUTBOUND'], Internal: ['TRANSFER'], Adjustments: ['ADJUSTMENT'] };
  const flat = (allowed && set[allowed]) ? set[allowed] : [];
  return types.some((t) => flat.includes(t));
}

function includeByStatus(allowed, itemStatus) {
  if (!allowed) return true;
  const set = { Draft: ['DRAFT', 'PENDING'], Waiting: ['IN_PROGRESS', 'SENT'], Ready: ['CONFIRMED'], Done: ['DISPATCHED', 'RECEIVED', 'COMPLETED'], Canceled: ['CANCELLED'] };
  const flat = (allowed && set[allowed]) ? set[allowed] : [];
  return flat.includes(itemStatus);
}

async function getDocuments(filters = {}) {
  const limit = Math.min(parseInt(filters.limit, 10) || 50, 100);
  const offset = parseInt(filters.offset, 10) || 0;
  const documentType = DOCUMENT_TYPES.includes(filters.documentType) ? filters.documentType : null;
  const status = STATUSES.includes(filters.status) ? filters.status : null;
  const warehouseId = filters.warehouseId || null;
  const categoryId = filters.categoryId || null;

  const result = [];

  if (includeByDocumentType(documentType, 'GRN', 'INBOUND')) {
    const grns = await prisma.grn.findMany({
      include: { po: { include: { supplier: { select: { name: true } } } }, lines: { include: { product: { select: { categoryId: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    for (const g of grns) {
      if (!includeByStatus(status, g.status)) continue;
      if (categoryId && g.lines.length > 0 && !g.lines.some((l) => l.product.categoryId === categoryId)) continue;
      result.push({
        id: g.id,
        documentType: 'Receipts',
        type: 'GRN',
        status: g.status,
        reference: g.po?.orderNumber,
        description: g.po?.supplier?.name,
        createdAt: g.createdAt,
        warehouseId: null,
      });
    }
  }

  if (includeByDocumentType(documentType, 'PICK_LIST', 'OUTBOUND')) {
    const pickLists = await prisma.pickList.findMany({
      include: { lines: { include: { product: { select: { categoryId: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    for (const pl of pickLists) {
      if (!includeByStatus(status, pl.status)) continue;
      if (categoryId && pl.lines.length > 0 && !pl.lines.some((l) => l.product.categoryId === categoryId)) continue;
      result.push({
        id: pl.id,
        documentType: 'Delivery',
        type: 'PICK_LIST',
        status: pl.status,
        reference: pl.orderRef,
        description: pl.orderRef || `Pick list ${pl.id.slice(0, 8)}`,
        createdAt: pl.createdAt,
        warehouseId: null,
      });
    }
  }

  if (includeByDocumentType(documentType, 'INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT')) {
    const movWhere = {};
    if (documentType === 'Receipts') movWhere.type = 'INBOUND';
    else if (documentType === 'Delivery') movWhere.type = 'OUTBOUND';
    else if (documentType === 'Internal') movWhere.type = 'TRANSFER';
    else if (documentType === 'Adjustments') movWhere.type = 'ADJUSTMENT';
    if (warehouseId) movWhere.OR = [{ fromLocationId: warehouseId }, { toLocationId: warehouseId }];
    if (categoryId) movWhere.product = { categoryId };
    const movements = await prisma.stockMovement.findMany({
      where: Object.keys(movWhere).length ? movWhere : undefined,
      include: { product: { select: { name: true, categoryId: true } }, fromLocation: { select: { id: true } }, toLocation: { select: { id: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const docTypeByMovement = { INBOUND: 'Receipts', OUTBOUND: 'Delivery', TRANSFER: 'Internal', ADJUSTMENT: 'Adjustments' };
    for (const m of movements) {
      if (warehouseId && m.fromLocationId !== warehouseId && m.toLocationId !== warehouseId) continue;
      if (categoryId && m.product?.categoryId !== categoryId) continue;
      result.push({
        id: m.id,
        documentType: docTypeByMovement[m.type],
        type: m.type,
        status: 'Done',
        reference: m.referenceId,
        description: m.product?.name,
        createdAt: m.createdAt,
        warehouseId: m.toLocationId || m.fromLocationId,
      });
    }
  }

  result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = result.length;
  const documents = result.slice(offset, offset + limit);
  return { documents, total };
}

module.exports = { getKpis, getAlerts, getDocuments };
