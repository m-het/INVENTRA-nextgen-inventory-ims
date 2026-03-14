const express = require('express');
const { z } = require('zod');
const movementsService = require('./movements.service');
const { validate } = require('../../middleware/validate');
const { requirePermission } = require('../../middleware/rbac');
const { auditLog } = require('../../middleware/audit');

const router = express.Router();

const createSchema = z.object({
  type: z.enum(['INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT']),
  productId: z.string().min(1),
  fromLocationId: z.string().optional().nullable(),
  toLocationId: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

router.post('/', requirePermission('movements:create'), validate(createSchema), async (req, res, next) => {
  try {
    const movement = await movementsService.create(req.valid, req.user.id);
    await auditLog(req.user.id, 'CREATE', 'StockMovement', movement.id, null, movement, req);
    res.status(201).json(movement);
  } catch (e) {
    next(e);
  }
});

router.get('/', requirePermission('movements:read'), async (req, res, next) => {
  try {
    const list = await movementsService.list(req.query);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
