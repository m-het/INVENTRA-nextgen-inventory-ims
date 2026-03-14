const express = require('express');
const auditService = require('./audit.service');
const { requirePermission } = require('../../middleware/rbac');

const router = express.Router();

router.get('/', requirePermission('audit:read'), async (req, res, next) => {
  try {
    const list = await auditService.list(req.query);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
