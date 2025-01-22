const express = require('express');
const router = express.Router();
const IBKRCredentials = require('../models/ibkrCredentials');
const ibkrService = require('../services/ibkrService');
const auth = require('../middleware/auth');

// Connect IBKR account
router.post('/connect', auth, async (req, res) => {
  try {
    const { username, password } = req.body;
    const userId = req.user.id;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Check if credentials already exist for this user
    let credentials = await IBKRCredentials.findOne({ userId });

    try {
      // Test connection with IBKR before saving credentials
      const connectionTest = await ibkrService.testConnection(username, password);
      
      if (!connectionTest.success) {
        return res.status(401).json({
          success: false,
          error: 'Invalid IBKR credentials'
        });
      }

      // Encrypt credentials
      const encryptedData = await IBKRCredentials.encryptCredentials(username, password);

      if (credentials) {
        // Update existing credentials
        credentials.encryptedUsername = encryptedData.encryptedUsername;
        credentials.usernameIV = encryptedData.usernameIV;
        credentials.encryptedPassword = encryptedData.encryptedPassword;
        credentials.passwordIV = encryptedData.passwordIV;
        credentials.authTag = encryptedData.authTag;
        credentials.connectionStatus = 'connected';
        credentials.lastConnected = new Date();
        credentials.lastError = null;
      } else {
        // Create new credentials
        credentials = new IBKRCredentials({
          userId,
          ...encryptedData,
          connectionStatus: 'connected',
          lastConnected: new Date()
        });
      }

      await credentials.save();

      // Initialize IBKR session
      await ibkrService.initializeSession(userId);

      res.json({
        success: true,
        message: 'IBKR account connected successfully',
        connectionStatus: 'connected'
      });
    } catch (error) {
      // Handle connection error
      if (credentials) {
        credentials.connectionStatus = 'error';
        credentials.lastError = error.message;
        await credentials.save();
      }

      throw error;
    }
  } catch (error) {
    console.error('Error connecting IBKR account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect IBKR account',
      details: error.message
    });
  }
});

// Disconnect IBKR account
router.post('/disconnect', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const credentials = await IBKRCredentials.findOne({ userId });

    if (!credentials) {
      return res.status(404).json({
        success: false,
        error: 'No IBKR account connected'
      });
    }

    // Close IBKR session
    await ibkrService.closeSession(userId);

    // Update connection status
    credentials.connectionStatus = 'disconnected';
    await credentials.save();

    res.json({
      success: true,
      message: 'IBKR account disconnected successfully'
    });
  } catch (error) {
    console.error('Error disconnecting IBKR account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to disconnect IBKR account'
    });
  }
});

// Get connection status
router.get('/status', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const credentials = await IBKRCredentials.findOne({ userId });

    if (!credentials) {
      return res.json({
        success: true,
        connected: false
      });
    }

    // Verify connection is still active
    const isConnected = await ibkrService.verifyConnection(userId);

    if (!isConnected && credentials.connectionStatus === 'connected') {
      credentials.connectionStatus = 'disconnected';
      await credentials.save();
    }

    res.json({
      success: true,
      connected: isConnected,
      status: credentials.connectionStatus,
      lastConnected: credentials.lastConnected,
      lastError: credentials.lastError
    });
  } catch (error) {
    console.error('Error checking IBKR connection status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check connection status'
    });
  }
});

module.exports = router;