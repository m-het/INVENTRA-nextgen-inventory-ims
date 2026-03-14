const express = require('express');
const { z } = require('zod');
const grnService = require('./grn.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  poId: z.string().min(1),
});

const directReceiptSchema = z.object({
  supplierId: z.string().min(1),
  locationId: z.string().min(1),
  notes: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string().min(1),
    quantityReceived: z.number().int().min(1)
  })).min(1),
});

const updateLineSchema = z.object({
  quantityReceived: z.number().int().min(0).optional(),
  binId: z.string().optional().nullable(),
});

router.get('/', requirePermission('grn:read'), async (req, res, next) => {
  try {
    const list = await grnService.list(req.query);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('grn:read'), async (req, res, next) => {
  try {
    const grn = await grnService.getById(req.params.id);
    res.json(grn);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('grn:create'), validate(createSchema), async (req, res, next) => {
  try {
    const grn = await grnService.createFromPo(req.valid.poId, req.user.id);
    await auditLog(req.user.id, 'CREATE', 'Grn', grn.id, null, grn, req);
    res.status(201).json(grn);
  } catch (e) {
    next(e);
  }
});

router.post('/direct', requirePermission('grn:create'), validate(directReceiptSchema), async (req, res, next) => {
  try {
    const grn = await grnService.createDirectReceipt(req.valid, req.user.id);
    await auditLog(req.user.id, 'CREATE', 'GrnDirect', grn.id, null, grn, req);
    res.status(201).json(grn);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/lines/:lineId', requirePermission('grn:update'), validate(updateLineSchema), async (req, res, next) => {
  try {
    const grn = await grnService.updateLine(req.params.id, req.params.lineId, req.valid);
    res.json(grn);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/lines/:lineId/shelve', requirePermission('grn:update'), validate(z.object({ binId: z.string().min(1) })), async (req, res, next) => {
  try {
    const grn = await grnService.shelve(req.params.id, req.params.lineId, req.valid.binId);
    res.json(grn);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/confirm', requirePermission('grn:confirm'), async (req, res, next) => {
  try {
    const grn = await grnService.confirm(req.params.id, req.user.id);
    await auditLog(req.user.id, 'UPDATE', 'Grn', grn.id, { status: 'DRAFT' }, { status: 'CONFIRMED' }, req);
    res.json(grn);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
