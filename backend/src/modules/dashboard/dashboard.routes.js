const express = require('express');
const dashboardService = require('./dashboard.service');
const { requirePermission } = require('../../middleware/rbac');

const router = express.Router();

router.get('/kpis', requirePermission('dashboard:read'), async (req, res, next) => {
  try {
    const kpis = await dashboardService.getKpis();
    res.json(kpis);
  } catch (e) {
    next(e);
  }
});

router.get('/alerts', requirePermission('dashboard:read'), async (req, res, next) => {
  try {
    const alerts = await dashboardService.getAlerts();
    res.json(alerts);
  } catch (e) {
    next(e);
  }
});

router.get('/documents', requirePermission('dashboard:read'), async (req, res, next) => {
  try {
    const result = await dashboardService.getDocuments(req.query);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
