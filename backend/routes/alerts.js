const express = require('express');
const router = express.Router();
const alertService = require('../services/alertService');
const authMiddleware = require('../middleware/auth');

// Create new alert
router.post('/', authMiddleware, async (req, res) => {
  try {
    const alert = await alertService.createAlert(req.user.id, req.body);
    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user alerts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const alerts = await alertService.getUserAlerts(req.user.id);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete alert
router.delete('/:alertId', authMiddleware, async (req, res) => {
  try {
    await alertService.deleteAlert(req.params.alertId);
    res.json({ message: 'Alert deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;