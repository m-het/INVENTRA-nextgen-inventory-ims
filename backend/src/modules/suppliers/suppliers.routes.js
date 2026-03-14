const express = require('express');
const { z } = require('zod');
const suppliersService = require('./suppliers.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.any().optional(),
});

const updateSchema = createSchema.partial();

router.get('/', requirePermission('suppliers:read'), async (req, res, next) => {
  try {
    const list = await suppliersService.list();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('suppliers:read'), async (req, res, next) => {
  try {
    const sup = await suppliersService.getById(req.params.id);
    res.json(sup);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('suppliers:write'), validate(createSchema), async (req, res, next) => {
  try {
    const sup = await suppliersService.create(req.valid);
    await auditLog(req.user.id, 'CREATE', 'Supplier', sup.id, null, sup, req);
    res.status(201).json(sup);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('suppliers:write'), validate(updateSchema), async (req, res, next) => {
  try {
    const old = await suppliersService.getById(req.params.id);
    const sup = await suppliersService.update(req.params.id, req.valid);
    await auditLog(req.user.id, 'UPDATE', 'Supplier', sup.id, old, sup, req);
    res.json(sup);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requirePermission('suppliers:write'), async (req, res, next) => {
  try {
    const old = await suppliersService.getById(req.params.id);
    await suppliersService.remove(req.params.id);
    await auditLog(req.user.id, 'DELETE', 'Supplier', old.id, old, null, req);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
