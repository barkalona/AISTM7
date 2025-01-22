const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const riskAnalysisService = require('../services/riskAnalysis');
const authMiddleware = require('../middleware/auth');

// Get portfolio recommendations
router.get('/:accountId', authMiddleware, async (req, res) => {
  try {
    // Get risk analysis first
    const analysis = await riskAnalysisService.analyzePortfolio(
      req.params.accountId
    );

    // Generate AI recommendations
    const recommendations = await aiService.generateRecommendations(analysis);
    
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply recommendations
router.post('/:accountId/apply', authMiddleware, async (req, res) => {
  try {
    const { recommendations } = req.body;
    // TODO: Implement actual trade execution
    res.json({ message: 'Recommendations applied successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;