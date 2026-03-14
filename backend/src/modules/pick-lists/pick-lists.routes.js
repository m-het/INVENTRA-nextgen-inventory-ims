const express = require('express');
const { z } = require('zod');
const pickListsService = require('./pick-lists.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  orderRef: z.string().optional(),
  assignedToId: z.string().optional(),
  lines: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    binId: z.string().optional().nullable(),
  })).min(1),
});

const pickSchema = z.object({
  quantityPicked: z.number().int().min(0),
});

router.get('/', requirePermission('pick-lists:read'), async (req, res, next) => {
  try {
    const list = await pickListsService.list(req.query);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('pick-lists:read'), async (req, res, next) => {
  try {
    const pl = await pickListsService.getById(req.params.id);
    res.json(pl);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('pick-lists:write'), validate(createSchema), async (req, res, next) => {
  try {
    const pl = await pickListsService.create(req.valid, req.user.id);
    await auditLog(req.user.id, 'CREATE', 'PickList', pl.id, null, pl, req);
    res.status(201).json(pl);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/lines/:lineId/pick', requirePermission('pick-lists:pick'), validate(pickSchema), async (req, res, next) => {
  try {
    const pl = await pickListsService.pick(req.params.id, req.params.lineId, req.valid.quantityPicked, req.user.id);
    res.json(pl);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/dispatch', requirePermission('pick-lists:dispatch'), async (req, res, next) => {
  try {
    const pl = await pickListsService.dispatch(req.params.id, req.user.id);
    await auditLog(req.user.id, 'UPDATE', 'PickList', pl.id, { status: 'IN_PROGRESS' }, { status: 'DISPATCHED' }, req);
    res.json(pl);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
