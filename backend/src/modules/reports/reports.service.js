const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function turnover(filters = {}) {
  const from = filters.fromDate ? new Date(filters.fromDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = filters.toDate ? new Date(filters.toDate) : new Date();
  const where = {
    createdAt: { gte: from, lte: to },
    type: { in: ['OUTBOUND', 'INBOUND'] },
  };
  if (filters.productId) where.productId = filters.productId;
  if (filters.locationId) {
    where.OR = [{ fromLocationId: filters.locationId }, { toLocationId: filters.locationId }];
  }
  const movements = await prisma.stockMovement.findMany({
    where,
    include: { product: { select: { id: true, sku: true, name: true } } },
  });
  const byProduct = {};
  for (const m of movements) {
    const key = m.productId;
    if (!byProduct[key]) byProduct[key] = { product: m.product, inbound: 0, outbound: 0 };
    if (m.type === 'INBOUND') byProduct[key].inbound += m.quantity;
    else byProduct[key].outbound += m.quantity;
  }
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    data: Object.values(byProduct).map(({ product, inbound, outbound }) => ({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      inbound,
      outbound,
      net: inbound - outbound,
    })),
  };
}

async function deadStock(filters = {}) {
  const days = parseInt(filters.days || '90', 10);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const movedProductIds = await prisma.stockMovement
    .findMany({
      where: { createdAt: { gte: since } },
      select: { productId: true },
      distinct: ['productId'],
    })
    .then((rows) => rows.map((r) => r.productId));
  const products = await prisma.product.findMany({
    where: movedProductIds.length ? { id: { notIn: movedProductIds } } : {},
    include: { stockLevels: { include: { location: true } } },
  });
  const withTotal = products.map((p) => ({
    ...p,
    totalQuantity: p.stockLevels.reduce((s, l) => s + l.quantity, 0),
  }));
  return {
    days,
    since: since.toISOString(),
    data: withTotal.filter((p) => p.totalQuantity > 0),
  };
}

async function demandTrends(filters = {}) {
  const days = parseInt(filters.days || '30', 10);
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = {
    createdAt: { gte: from },
    type: 'OUTBOUND',
  };
  if (filters.productId) where.productId = filters.productId;
  const movements = await prisma.stockMovement.findMany({
    where,
    include: { product: { select: { id: true, sku: true, name: true } } },
  });
  const byWeek = {};
  for (const m of movements) {
    const d = new Date(m.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    if (!byWeek[key]) byWeek[key] = {};
    const pk = m.productId;
    if (!byWeek[key][pk]) byWeek[key][pk] = { product: m.product, quantity: 0 };
    byWeek[key][pk].quantity += m.quantity;
  }
  const data = Object.entries(byWeek).map(([week, products]) => ({
    week,
    products: Object.values(products),
  }));
  return { from: from.toISOString(), days, data };
}

module.exports = { turnover, deadStock, demandTrends };
