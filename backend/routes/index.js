const express = require('express');
const router = express.Router();

// Import route modules
const portfolioRoutes = require('./portfolio');
const riskRoutes = require('./risk');
const recommendationRoutes = require('./recommendations');
const alertRoutes = require('./alerts');
const tradeRoutes = require('./trades');

// Setup routes
router.use('/portfolio', portfolioRoutes);
router.use('/risk', riskRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/alerts', alertRoutes);
router.use('/trades', tradeRoutes);

module.exports = router;