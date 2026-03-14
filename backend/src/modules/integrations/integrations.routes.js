const express = require('express');
const integrationsService = require('./integrations.service');
const { requirePermission } = require('../../middleware/rbac');

const router = express.Router();

router.post('/webhook/:provider', requirePermission('integrations:write'), async (req, res, next) => {
  try {
    const result = await integrationsService.handleWebhook(req.params.provider, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
