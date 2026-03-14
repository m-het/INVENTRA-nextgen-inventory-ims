const express = require('express');
const { z } = require('zod');
const purchaseOrdersService = require('./purchase-orders.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  supplierId: z.string().min(1),
  status: z.enum(['DRAFT', 'SENT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
  orderNumber: z.string().optional(),
  orderedAt: z.string().datetime().optional(),
  expectedAt: z.string().datetime().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    quantityOrdered: z.number().int().positive(),
    unitPrice: z.number().optional(),
  })).optional(),
});

const updateSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'PARTIAL_RECEIVED', 'RECEIVED', 'CANCELLED']).optional(),
  orderedAt: z.string().datetime().optional(),
  expectedAt: z.string().datetime().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    quantityOrdered: z.number().int().positive(),
    unitPrice: z.number().optional(),
  })).optional(),
});

const addLineSchema = z.object({
  productId: z.string(),
  quantityOrdered: z.number().int().positive(),
  unitPrice: z.number().optional(),
});

router.get('/', requirePermission('purchase-orders:read'), async (req, res, next) => {
  try {
    const list = await purchaseOrdersService.list(req.query);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('purchase-orders:read'), async (req, res, next) => {
  try {
    const po = await purchaseOrdersService.getById(req.params.id);
    res.json(po);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('purchase-orders:write'), validate(createSchema), async (req, res, next) => {
  try {
    const po = await purchaseOrdersService.create(req.valid, req.user.id);
    await auditLog(req.user.id, 'CREATE', 'PurchaseOrder', po.id, null, po, req);
    res.status(201).json(po);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('purchase-orders:write'), validate(updateSchema), async (req, res, next) => {
  try {
    const old = await purchaseOrdersService.getById(req.params.id);
    const po = await purchaseOrdersService.update(req.params.id, req.valid);
    await auditLog(req.user.id, 'UPDATE', 'PurchaseOrder', po.id, old, po, req);
    res.json(po);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/lines', requirePermission('purchase-orders:write'), validate(addLineSchema), async (req, res, next) => {
  try {
    const line = await purchaseOrdersService.addLine(req.params.id, req.valid);
    res.status(201).json(line);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
