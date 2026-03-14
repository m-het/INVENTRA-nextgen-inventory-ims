const express = require('express');
const { z } = require('zod');
const warehousesService = require('./warehouses.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
});

const updateSchema = createSchema.partial();

const createBinSchema = z.object({
  code: z.string().min(1),
  name: z.string().optional(),
});

router.get('/', requirePermission('warehouses:read'), async (req, res, next) => {
  try {
    const list = await warehousesService.list();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('warehouses:read'), async (req, res, next) => {
  try {
    const wh = await warehousesService.getById(req.params.id);
    res.json(wh);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('warehouses:write'), validate(createSchema), async (req, res, next) => {
  try {
    const wh = await warehousesService.create(req.valid);
    await auditLog(req.user.id, 'CREATE', 'Warehouse', wh.id, null, wh, req);
    res.status(201).json(wh);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('warehouses:write'), validate(updateSchema), async (req, res, next) => {
  try {
    const old = await warehousesService.getById(req.params.id);
    const wh = await warehousesService.update(req.params.id, req.valid);
    await auditLog(req.user.id, 'UPDATE', 'Warehouse', wh.id, old, wh, req);
    res.json(wh);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requirePermission('warehouses:write'), async (req, res, next) => {
  try {
    const old = await warehousesService.getById(req.params.id);
    await warehousesService.remove(req.params.id);
    await auditLog(req.user.id, 'DELETE', 'Warehouse', old.id, old, null, req);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.get('/:id/bins', requirePermission('warehouses:read'), async (req, res, next) => {
  try {
    const bins = await warehousesService.listBins(req.params.id);
    res.json(bins);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/bins', requirePermission('warehouses:write'), validate(createBinSchema), async (req, res, next) => {
  try {
    const bin = await warehousesService.createBin(req.params.id, req.valid);
    res.status(201).json(bin);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
