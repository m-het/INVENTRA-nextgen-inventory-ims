const express = require('express');
const reportsService = require('./reports.service');
const { requirePermission } = require('../../middleware/rbac');

const router = express.Router();

router.get('/turnover', requirePermission('reports:read'), async (req, res, next) => {
  try {
    const result = await reportsService.turnover(req.query);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/dead-stock', requirePermission('reports:read'), async (req, res, next) => {
  try {
    const result = await reportsService.deadStock(req.query);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/demand-trends', requirePermission('reports:read'), async (req, res, next) => {
  try {
    const result = await reportsService.demandTrends(req.query);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
