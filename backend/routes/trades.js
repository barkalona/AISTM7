const express = require('express');
const router = express.Router();
const tradeService = require('../services/tradeService');
const auth = require('../middleware/auth');

// Get trade recommendations for a portfolio
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    const recommendations = await tradeService.generateTradeRecommendations(accountId);
    
    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting trade recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trade recommendations'
    });
  }
});

// Get portfolio rebalance analysis
router.get('/rebalance/analysis', auth, async (req, res) => {
  try {
    const { accountId } = req.query;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required'
      });
    }

    const analysis = await tradeService.getPortfolioRebalanceAnalysis(accountId);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error getting rebalance analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate rebalance analysis'
    });
  }
});

// Note: Trade execution endpoints have been removed as the service now only
// provides recommendations and analysis without executing actual trades.

module.exports = router;