const express = require('express');
const router = express.Router();
const { createLogger } = require('../utils/logging');
const { validateRequest } = require('../utils/validation');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const balanceRequirementService = require('../services/balanceRequirementService');
const tokenPriceService = require('../services/tokenPriceService');

const logger = createLogger('TokenRequirementRoutes');

/**
 * @route GET /api/token-requirement/current
 * @description Get current token balance requirement and price
 * @access Public
 */
router.get('/current', async (req, res) => {
  try {
    const requirement = await balanceRequirementService.getCurrentRequirement();
    const price = await tokenPriceService.getCurrentPrice();
    
    res.json({
      requirement: requirement.requirement,
      price,
      usdValue: price * requirement.requirement,
      timestamp: requirement.timestamp,
      lastUpdate: requirement.timestamp
    });
  } catch (error) {
    logger.error('Failed to get current requirement:', error);
    res.status(500).json({ error: 'Failed to get current requirement' });
  }
});

/**
 * @route GET /api/token-requirement/history
 * @description Get token requirement history
 * @access Public
 * @query duration - Time period for history (24h, 7d, 30d)
 */
router.get('/history', async (req, res) => {
  try {
    const { duration = '7d' } = req.query;
    const history = await balanceRequirementService.getRequirementHistory(duration);
    
    res.json({
      history,
      duration
    });
  } catch (error) {
    logger.error('Failed to get requirement history:', error);
    res.status(500).json({ error: 'Failed to get requirement history' });
  }
});

/**
 * @route GET /api/token-requirement/check/:address
 * @description Check if an address meets the current requirement
 * @access Public
 * @param address - Solana wallet address to check
 */
router.get('/check/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const userId = await getUserIdFromAddress(address);
    
    if (!userId) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const accessStatus = await balanceRequirementService.checkUserAccess(userId);
    
    res.json({
      address,
      ...accessStatus,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to check address requirement:', error);
    res.status(500).json({ error: 'Failed to check address requirement' });
  }
});

/**
 * @route GET /api/token-requirement/grace-period/:userId
 * @description Get active grace period details for a user
 * @access Private
 */
router.get('/grace-period/:userId', requireAuth, async (req, res) => {
  try {
    // Ensure user can only access their own grace period
    if (req.params.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const gracePeriod = await db.query(
      `SELECT * FROM user_grace_periods
       WHERE user_id = $1
       AND status = 'active'
       AND end_date > NOW()
       ORDER BY end_date DESC
       LIMIT 1`,
      [req.params.userId]
    );

    if (!gracePeriod.rows.length) {
      return res.json({ hasGracePeriod: false });
    }

    res.json({
      hasGracePeriod: true,
      gracePeriod: gracePeriod.rows[0]
    });
  } catch (error) {
    logger.error('Failed to get grace period:', error);
    res.status(500).json({ error: 'Failed to get grace period' });
  }
});

/**
 * @route POST /api/token-requirement/update
 * @description Force update of token requirement (admin only)
 * @access Private (Admin)
 */
router.post('/update', requireAuth, requireAdmin, async (req, res) => {
  try {
    const newRequirement = await balanceRequirementService.updateRequirement();
    
    res.json({
      success: true,
      requirement: newRequirement,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Failed to update requirement:', error);
    res.status(500).json({ error: 'Failed to update requirement' });
  }
});

/**
 * @route POST /api/token-requirement/grace-period
 * @description Manually create grace period for a user (admin only)
 * @access Private (Admin)
 */
router.post('/grace-period', requireAuth, requireAdmin, validateRequest({
  body: {
    userId: { type: 'string', required: true },
    duration: { type: 'number', required: true, min: 1, max: 168 } // Max 1 week in hours
  }
}), async (req, res) => {
  try {
    const { userId, duration } = req.body;
    
    // Get user's current balance
    const balanceResult = await db.query(
      'SELECT balance FROM wallets WHERE user_id = $1',
      [userId]
    );

    if (!balanceResult.rows.length) {
      return res.status(404).json({ error: 'User wallet not found' });
    }

    const currentRequirement = await balanceRequirementService.getCurrentRequirement();
    
    // Create grace period
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 3600000);

    await db.query(
      `INSERT INTO user_grace_periods (
        user_id,
        start_date,
        end_date,
        initial_balance,
        required_balance,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        startDate,
        endDate,
        balanceResult.rows[0].balance,
        currentRequirement.requirement,
        'active'
      ]
    );

    res.json({
      success: true,
      gracePeriod: {
        userId,
        startDate,
        endDate,
        initialBalance: balanceResult.rows[0].balance,
        requiredBalance: currentRequirement.requirement
      }
    });
  } catch (error) {
    logger.error('Failed to create grace period:', error);
    res.status(500).json({ error: 'Failed to create grace period' });
  }
});

// Helper function to get user ID from wallet address
async function getUserIdFromAddress(address) {
  try {
    const result = await db.query(
      'SELECT user_id FROM wallets WHERE address = $1',
      [address]
    );
    return result.rows[0]?.user_id || null;
  } catch (error) {
    logger.error('Failed to get user ID from address:', error);
    return null;
  }
}

module.exports = router;