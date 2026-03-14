const express = require('express');
const { z } = require('zod');
const productsService = require('./products.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().optional().nullable(),
  unitOfMeasure: z.string().optional(),
  barcode: z.string().optional().nullable(),
  description: z.string().optional(),
  reorderLevel: z.number().int().min(0).optional(),
  initialStock: z.number().int().min(0).optional(),
  initialWarehouseId: z.string().optional().nullable(),
});

const updateSchema = createSchema.partial();

router.get('/', requirePermission('products:read'), async (req, res, next) => {
  try {
    const list = await productsService.list(req.query);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/by-sku/:sku', requirePermission('products:read'), async (req, res, next) => {
  try {
    const product = await productsService.getBySku(req.params.sku);
    res.json(product);
  } catch (e) {
    next(e);
  }
});

router.get('/by-barcode/:code', requirePermission('products:read'), async (req, res, next) => {
  try {
    const product = await productsService.getByBarcode(req.params.code);
    res.json(product);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('products:read'), async (req, res, next) => {
  try {
    const product = await productsService.getById(req.params.id);
    res.json(product);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('products:write'), validate(createSchema), async (req, res, next) => {
  try {
    const product = await productsService.create(req.valid, req.user.id);
    await auditLog(req.user.id, 'CREATE', 'Product', product.id, null, product, req);
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('products:write'), validate(updateSchema), async (req, res, next) => {
  try {
    const old = await productsService.getById(req.params.id);
    const product = await productsService.update(req.params.id, req.valid);
    await auditLog(req.user.id, 'UPDATE', 'Product', product.id, old, product, req);
    res.json(product);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requirePermission('products:delete'), async (req, res, next) => {
  try {
    const old = await productsService.getById(req.params.id);
    await productsService.remove(req.params.id);
    await auditLog(req.user.id, 'DELETE', 'Product', old.id, old, null, req);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
