const express = require('express');
const { z } = require('zod');
const stockCountsService = require('./stock-counts.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  locationId: z.string().min(1),
});

const addLinesSchema = z.object({
  lines: z.array(z.object({
    productId: z.string(),
    binId: z.string().optional().nullable(),
  })).optional(),
  productIds: z.array(z.string()).optional(),
}).refine((d) => (d.lines && d.lines.length > 0) || (d.productIds && d.productIds.length > 0), { message: 'Provide lines or productIds' });

const submitLinesSchema = z.object({
  lines: z.array(z.object({
    lineId: z.string(),
    countedQuantity: z.number().int().min(0),
  })),
});

router.get('/', requirePermission('stock-counts:read'), async (req, res, next) => {
  try {
    const list = await stockCountsService.list(req.query);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('stock-counts:read'), async (req, res, next) => {
  try {
    const sc = await stockCountsService.getById(req.params.id);
    res.json(sc);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('stock-counts:write'), validate(createSchema), async (req, res, next) => {
  try {
    const sc = await stockCountsService.create(req.valid, req.user.id);
    await auditLog(req.user.id, 'CREATE', 'StockCount', sc.id, null, sc, req);
    res.status(201).json(sc);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/lines', requirePermission('stock-counts:write'), async (req, res, next) => {
  try {
    const body = req.body || {};
    const lines = body.lines && body.lines.length > 0
      ? body.lines
      : (body.productIds || []).map((productId) => ({ productId }));
    if (lines.length === 0) {
      return next(new (require('../../shared/errors').ValidationError)('Provide lines or productIds'));
    }
    const sc = await stockCountsService.addLines(req.params.id, lines);
    res.json(sc);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/lines', requirePermission('stock-counts:submit'), validate(submitLinesSchema), async (req, res, next) => {
  try {
    const sc = await stockCountsService.submitLines(req.params.id, req.valid.lines, req.user.id);
    res.json(sc);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/complete', requirePermission('stock-counts:complete'), async (req, res, next) => {
  try {
    const sc = await stockCountsService.complete(req.params.id, req.user.id);
    await auditLog(req.user.id, 'UPDATE', 'StockCount', sc.id, { status: 'IN_PROGRESS' }, { status: 'COMPLETED' }, req);
    res.json(sc);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
