const express = require('express');
const { z } = require('zod');
const usersService = require('./users.service');
const { validate } = require('../../middleware/validate');
const { requirePermission, requireRole } = require('../../middleware/rbac');

const router = express.Router();

router.get('/me', requirePermission('users:read'), async (req, res, next) => {
  try {
    const user = await usersService.getMe(req.user.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/', requirePermission('users:read'), async (req, res, next) => {
  try {
    const list = await usersService.list(req.user.id, req.user.role);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

const updateMeSchema = z.object({
  name: z.string().optional(),
  password: z.string().min(6).optional(),
});

router.patch('/me', requirePermission('users:read'), validate(updateMeSchema), async (req, res, next) => {
  try {
    const user = await usersService.updateMe(req.user.id, req.valid);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['INVENTORY_MANAGER', 'WAREHOUSE_STAFF']).optional(),
});

router.patch('/:id', requireRole('INVENTORY_MANAGER'), validate(updateUserSchema), async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.user.id, req.params.id, req.valid);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
