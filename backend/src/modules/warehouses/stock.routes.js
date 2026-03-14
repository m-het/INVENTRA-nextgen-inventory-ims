const express = require('express');
const stockService = require('./stock.service');
const { requirePermission } = require('../../middleware/rbac');

const router = express.Router();

router.get('/levels', requirePermission('stock:read'), async (req, res, next) => {
  try {
    const levels = await stockService.getLevels(req.query);
    res.json(levels);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
