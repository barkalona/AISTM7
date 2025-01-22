const express = require('express');
const router = express.Router();
const riskAnalysisService = require('../services/riskAnalysis');
const authMiddleware = require('../middleware/auth');
const WebSocket = require('ws');

// Get portfolio risk metrics
router.get('/metrics/:accountId', authMiddleware, async (req, res) => {
  try {
    const metrics = await riskAnalysisService.analyzePortfolio(
      req.user.id,
      req.params.accountId
    );
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching risk metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run stress tests
router.post('/stress-test/:accountId', authMiddleware, async (req, res) => {
  try {
    const scenarios = req.body.scenarios || [
      {
        name: 'Market Crash',
        description: 'Simulates a severe market downturn',
        factors: {
          stocks: 0.7, // -30%
          bonds: 0.9, // -10%
          crypto: 0.5, // -50%
          commodities: 0.8 // -20%
        }
      },
      {
        name: 'Inflation Surge',
        description: 'Simulates high inflation environment',
        factors: {
          stocks: 0.85,
          bonds: 0.8,
          crypto: 0.9,
          commodities: 1.2
        }
      },
      {
        name: 'Tech Bubble',
        description: 'Simulates tech sector collapse',
        factors: {
          stocks: 0.6,
          bonds: 1.05,
          crypto: 0.4,
          commodities: 1.1
        }
      }
    ];

    const results = await riskAnalysisService.stressTestPortfolio(
      req.user.id,
      req.params.accountId,
      scenarios
    );
    res.json(results);
  } catch (error) {
    console.error('Error running stress tests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Run Monte Carlo simulation
router.post('/monte-carlo/:accountId', authMiddleware, async (req, res) => {
  try {
    const { simulations = 1000, days = 252 } = req.body;
    const [positions, history] = await Promise.all([
      riskAnalysisService.getPositions(req.user.id, req.params.accountId),
      riskAnalysisService.getHistoricalData(req.user.id, req.params.accountId, '1Y', '1d')
    ]);

    const returns = riskAnalysisService.calculateReturns(history);
    const results = await riskAnalysisService.runMonteCarloSimulation(
      positions,
      returns,
      simulations,
      days
    );
    res.json(results);
  } catch (error) {
    console.error('Error running Monte Carlo simulation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get correlation analysis
router.get('/correlations/:accountId', authMiddleware, async (req, res) => {
  try {
    const [positions, history] = await Promise.all([
      riskAnalysisService.getPositions(req.user.id, req.params.accountId),
      riskAnalysisService.getHistoricalData(req.user.id, req.params.accountId, '1Y', '1d')
    ]);

    const returns = riskAnalysisService.calculateReturns(history);
    const correlations = riskAnalysisService.calculateAssetCorrelations(positions, returns);
    res.json(correlations);
  } catch (error) {
    console.error('Error calculating correlations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get beta analysis
router.get('/beta/:accountId', authMiddleware, async (req, res) => {
  try {
    const [positions, history] = await Promise.all([
      riskAnalysisService.getPositions(req.user.id, req.params.accountId),
      riskAnalysisService.getHistoricalData(req.user.id, req.params.accountId, '1Y', '1d')
    ]);

    const returns = riskAnalysisService.calculateReturns(history);
    const betaMetrics = riskAnalysisService.calculateBetaMetrics(positions, returns);
    res.json(betaMetrics);
  } catch (error) {
    console.error('Error calculating beta metrics:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket endpoint for real-time risk updates
router.ws('/live/:accountId', authMiddleware, (ws, req) => {
  const userId = req.user.id;
  const accountId = req.params.accountId;
  let updateInterval;

  const sendUpdate = async () => {
    try {
      const metrics = await riskAnalysisService.analyzePortfolio(userId, accountId);
      ws.send(JSON.stringify({
        type: 'riskUpdate',
        data: metrics
      }));
    } catch (error) {
      console.error('Error sending risk update:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  };

  // Start sending updates
  updateInterval = setInterval(sendUpdate, 60000); // Update every minute

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      
      switch (data.type) {
        case 'requestUpdate':
          await sendUpdate();
          break;
          
        case 'updateInterval':
          clearInterval(updateInterval);
          updateInterval = setInterval(sendUpdate, data.interval);
          break;
          
        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: error.message }));
    }
  });

  ws.on('close', () => {
    clearInterval(updateInterval);
  });
});

module.exports = router;