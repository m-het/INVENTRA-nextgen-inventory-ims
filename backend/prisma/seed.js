const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const manager = await prisma.user.upsert({
    where: { email: 'manager@ims.test' },
    update: {},
    create: {
      email: 'manager@ims.test',
      passwordHash,
      name: 'Inventory Manager',
      role: 'INVENTORY_MANAGER',
    },
  });
  const staff = await prisma.user.upsert({
    where: { email: 'staff@ims.test' },
    update: {},
    create: {
      email: 'staff@ims.test',
      passwordHash,
      name: 'Warehouse Staff',
      role: 'WAREHOUSE_STAFF',
    },
  });

  const cat1 = await prisma.category.upsert({
    where: { code: 'ELEC' },
    update: {},
    create: { name: 'Electronics', code: 'ELEC' },
  });
  const cat2 = await prisma.category.upsert({
    where: { code: 'OFFICE' },
    update: {},
    create: { name: 'Office Supplies', code: 'OFFICE' },
  });

  const wh = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: { code: 'WH-MAIN', name: 'Main Warehouse', type: 'main' },
  });
  const bin = await prisma.bin.upsert({
    where: { warehouseId_code: { warehouseId: wh.id, code: 'A-01' } },
    update: {},
    create: { warehouseId: wh.id, code: 'A-01', name: 'Aisle A-01' },
  });

  const p1 = await prisma.product.upsert({
    where: { sku: 'SKU-001' },
    update: {},
    create: {
      sku: 'SKU-001',
      name: 'Laptop Stand',
      categoryId: cat1.id,
      unitOfMeasure: 'pcs',
      barcode: '8901234567890',
      reorderLevel: 10,
    },
  });
  const p2 = await prisma.product.upsert({
    where: { sku: 'SKU-002' },
    update: {},
    create: {
      sku: 'SKU-002',
      name: 'Notebook A4',
      categoryId: cat2.id,
      unitOfMeasure: 'pcs',
      reorderLevel: 50,
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { code: 'SUP-01' },
    update: {},
    create: {
      name: 'Acme Supplies',
      code: 'SUP-01',
      contactEmail: 'orders@acme.example',
    },
  });

  const existingPo = await prisma.purchaseOrder.findFirst({ where: { orderNumber: 'PO-DEMO-001' } });
  const po = existingPo || await prisma.purchaseOrder.create({
    data: {
      supplierId: supplier.id,
      status: 'DRAFT',
      orderNumber: 'PO-DEMO-001',
      createdById: manager.id,
      lines: {
        create: [
          { productId: p1.id, quantityOrdered: 20 },
          { productId: p2.id, quantityOrdered: 100 },
        ],
      },
    },
  });

  console.log('Seed done:', { manager: manager.email, staff: staff.email, categories: 2, products: 2, warehouse: wh.code, supplier: supplier.code, po: po.orderNumber });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
