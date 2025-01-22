const express = require('express');
const router = express.Router();
const automationService = require('../services/automationService');
const auth = require('../middleware/auth');
const { validateWalletAddress } = require('../utils/validation');
const { encryptCredentials } = require('../utils/encryption');

// Initialize automation for a user
router.post('/initialize', auth, async (req, res) => {
  try {
    const { walletAddress, ibkrUsername, ibkrPassword } = req.body;
    const userId = req.user.id;

    // Validate wallet address
    if (!validateWalletAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Solana wallet address'
      });
    }

    // Encrypt IBKR credentials
    const encryptedCredentials = await encryptCredentials({
      username: ibkrUsername,
      password: ibkrPassword
    });

    // Initialize automation service
    await automationService.initialize(
      userId,
      walletAddress,
      encryptedCredentials
    );

    res.json({
      success: true,
      message: 'AI Agent automation initialized successfully'
    });
  } catch (error) {
    console.error('Automation initialization failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initialize automation'
    });
  }
});

// Get automation status
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const status = await automationService.getStatus(userId);

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Failed to get automation status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get automation status'
    });
  }
});

// Pause automation
router.post('/pause', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await automationService.pause(userId);

    res.json({
      success: true,
      message: 'Automation paused successfully'
    });
  } catch (error) {
    console.error('Failed to pause automation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to pause automation'
    });
  }
});

// Resume automation
router.post('/resume', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await automationService.resume(userId);

    res.json({
      success: true,
      message: 'Automation resumed successfully'
    });
  } catch (error) {
    console.error('Failed to resume automation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to resume automation'
    });
  }
});

// Get automation metrics
router.get('/metrics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const metrics = await automationService.getMetrics(userId);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Failed to get automation metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get automation metrics'
    });
  }
});

module.exports = router;