const express = require('express');
const router = express.Router();
const ibkrService = require('../services/ibkrService');
const authMiddleware = require('../middleware/auth');
const WebSocket = require('ws');

// Get portfolio data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const portfolio = await ibkrService.getPortfolio(req.user.id);
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get account summary
router.get('/:accountId/summary', authMiddleware, async (req, res) => {
  try {
    const summary = await ibkrService.getAccountSummary(req.user.id, req.params.accountId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get positions for account
router.get('/:accountId/positions', authMiddleware, async (req, res) => {
  try {
    const positions = await ibkrService.getPositions(req.user.id, req.params.accountId);
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical data for contract
router.get('/history/:contractId', authMiddleware, async (req, res) => {
  try {
    const { period = '1M', barSize = '1d' } = req.query;
    const history = await ibkrService.getHistoricalData(
      req.user.id,
      req.params.contractId,
      period,
      barSize
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subscribe to real-time market data
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { contractIds } = req.body;
    if (!Array.isArray(contractIds)) {
      return res.status(400).json({ error: 'contractIds must be an array' });
    }

    const subscriptions = await ibkrService.subscribeMarketData(req.user.id, contractIds);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unsubscribe from real-time market data
router.post('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { contractIds } = req.body;
    if (!Array.isArray(contractIds)) {
      return res.status(400).json({ error: 'contractIds must be an array' });
    }

    await ibkrService.unsubscribeMarketData(req.user.id, contractIds);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket endpoint for real-time updates
router.ws('/live', authMiddleware, (ws, req) => {
  const userId = req.user.id;
  
  // Store the WebSocket connection
  ibkrService.addWebSocket(userId, ws);

  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);
      
      switch (data.type) {
        case 'subscribe':
          if (Array.isArray(data.contractIds)) {
            await ibkrService.subscribeMarketData(userId, data.contractIds);
          }
          break;
          
        case 'unsubscribe':
          if (Array.isArray(data.contractIds)) {
            await ibkrService.unsubscribeMarketData(userId, data.contractIds);
          }
          break;
          
        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ error: error.message }));
    }
  });

  ws.on('close', () => {
    ibkrService.removeWebSocket(userId);
  });
});

module.exports = router;