const { Role } = require('@prisma/client');

const PERMISSIONS = {
  // Users & auth
  'users:read': [Role.INVENTORY_MANAGER],
  'users:create': [Role.INVENTORY_MANAGER],
  'users:update': [Role.INVENTORY_MANAGER],
  'users:delete': [Role.INVENTORY_MANAGER],

  // Catalog
  'categories:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'categories:write': [Role.INVENTORY_MANAGER],
  'products:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'products:write': [Role.INVENTORY_MANAGER],
  'products:delete': [Role.INVENTORY_MANAGER],

  // Warehouses & stock
  'warehouses:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'warehouses:write': [Role.INVENTORY_MANAGER],
  'stock:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'stock:write': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'movements:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'movements:create': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],

  // Suppliers & PO
  'suppliers:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'suppliers:write': [Role.INVENTORY_MANAGER],
  'purchase-orders:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'purchase-orders:write': [Role.INVENTORY_MANAGER],

  // GRN
  'grn:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'grn:create': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'grn:update': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'grn:confirm': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],

  // Pick lists
  'pick-lists:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'pick-lists:write': [Role.INVENTORY_MANAGER],
  'pick-lists:pick': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'pick-lists:dispatch': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],

  // Stock count
  'stock-counts:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'stock-counts:write': [Role.INVENTORY_MANAGER],
  'stock-counts:submit': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'stock-counts:complete': [Role.INVENTORY_MANAGER],

  // Dashboard & reports
  'dashboard:read': [Role.INVENTORY_MANAGER, Role.WAREHOUSE_STAFF],
  'reports:read': [Role.INVENTORY_MANAGER],
  'audit:read': [Role.INVENTORY_MANAGER],
  'integrations:write': [Role.INVENTORY_MANAGER],
};

function can(role, permission) {
  const allowed = PERMISSIONS[permission];
  if (!allowed) return false;
  return allowed.includes(role);
}

module.exports = { PERMISSIONS, can };
