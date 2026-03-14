const express = require('express');
const { z } = require('zod');
const categoriesService = require('./categories.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  parentId: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  parentId: z.string().optional().nullable(),
});

router.get('/', requirePermission('categories:read'), async (req, res, next) => {
  try {
    const list = await categoriesService.list();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requirePermission('categories:read'), async (req, res, next) => {
  try {
    const cat = await categoriesService.getById(req.params.id);
    res.json(cat);
  } catch (e) {
    next(e);
  }
});

router.post('/', requirePermission('categories:write'), validate(createSchema), async (req, res, next) => {
  try {
    const cat = await categoriesService.create(req.valid);
    await auditLog(req.user.id, 'CREATE', 'Category', cat.id, null, cat, req);
    res.status(201).json(cat);
  } catch (e) {
    next(e);
  }
});

router.patch('/:id', requirePermission('categories:write'), validate(updateSchema), async (req, res, next) => {
  try {
    const old = await categoriesService.getById(req.params.id);
    const cat = await categoriesService.update(req.params.id, req.valid);
    await auditLog(req.user.id, 'UPDATE', 'Category', cat.id, old, cat, req);
    res.json(cat);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', requirePermission('categories:write'), async (req, res, next) => {
  try {
    const old = await categoriesService.getById(req.params.id);
    await categoriesService.remove(req.params.id);
    await auditLog(req.user.id, 'DELETE', 'Category', old.id, old, null, req);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

module.exports = router;
