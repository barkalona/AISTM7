const { createLogger } = require('../utils/logging');
const { redis } = require('../utils/redis');
const { db } = require('../utils/db');
const tokenPriceService = require('./tokenPriceService');
const notificationService = require('./notificationService');

const logger = createLogger('BalanceRequirementService');

class BalanceRequirementService {
  constructor() {
    this.targetUsdValue = 20; // $20 USD target value
    this.minTokens = 1000; // Minimum number of tokens regardless of price
    this.maxTokens = 1000000; // Maximum number of tokens regardless of price
    this.updateInterval = 3600000; // 1 hour
    this.gracePeriodDuration = 72 * 3600000; // 72 hours
    this.lastUpdate = null;
    this.currentRequirement = null;
  }

  async initialize() {
    try {
      // Load current requirement from database
      const result = await db.query(
        'SELECT requirement FROM balance_requirement_history ORDER BY timestamp DESC LIMIT 1'
      );
      
      if (result.rows.length > 0) {
        this.currentRequirement = result.rows[0].requirement;
      } else {
        // Set initial requirement
        await this.updateRequirement();
      }

      // Start periodic updates
      this.startPeriodicUpdates();
      
      logger.info('BalanceRequirementService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize BalanceRequirementService:', error);
      throw error;
    }
  }

  startPeriodicUpdates() {
    setInterval(async () => {
      try {
        await this.updateRequirement();
      } catch (error) {
        logger.error('Failed to update balance requirement:', error);
      }
    }, this.updateInterval);
  }

  async updateRequirement() {
    try {
      const currentPrice = await tokenPriceService.getCurrentPrice();
      if (!currentPrice) {
        throw new Error('Unable to get current token price');
      }

      // Calculate new requirement
      let newRequirement = Math.round(this.targetUsdValue / currentPrice);
      
      // Apply min/max bounds
      newRequirement = Math.max(this.minTokens, Math.min(this.maxTokens, newRequirement));
      
      // Check if change is significant (>5%)
      const requirementChange = this.currentRequirement
        ? (newRequirement - this.currentRequirement) / this.currentRequirement
        : 1;

      if (Math.abs(requirementChange) >= 0.05 || !this.currentRequirement) {
        await this.applyNewRequirement(newRequirement, currentPrice);
      }

      return newRequirement;
    } catch (error) {
      logger.error('Error updating balance requirement:', error);
      throw error;
    }
  }

  async applyNewRequirement(newRequirement, currentPrice) {
    try {
      // Store in database
      await db.query(
        `INSERT INTO balance_requirement_history (
          requirement,
          token_price,
          usd_target,
          timestamp,
          reason
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          newRequirement,
          currentPrice,
          this.targetUsdValue,
          new Date(),
          'Price-based adjustment'
        ]
      );

      // Update cache
      await redis.set('aistm7:balance_requirement', JSON.stringify({
        requirement: newRequirement,
        timestamp: Date.now(),
        price: currentPrice
      }), 'EX', 3600); // Cache for 1 hour

      // Notify affected users
      await this.notifyAffectedUsers(newRequirement);

      this.currentRequirement = newRequirement;
      this.lastUpdate = Date.now();

      logger.info(`Balance requirement updated to ${newRequirement} tokens`);
    } catch (error) {
      logger.error('Failed to apply new requirement:', error);
      throw error;
    }
  }

  async notifyAffectedUsers(newRequirement) {
    try {
      // Find users who will fall below requirement
      const affectedUsers = await db.query(
        `SELECT u.id, u.email, w.balance
         FROM users u
         JOIN wallets w ON u.id = w.user_id
         WHERE w.balance >= $1 AND w.balance < $2
         AND u.status = 'active'`,
        [this.currentRequirement, newRequirement]
      );

      for (const user of affectedUsers.rows) {
        await this.createGracePeriod(user.id, user.balance, newRequirement);
        
        await notificationService.sendAlert({
          type: 'BALANCE_REQUIREMENT',
          severity: 'HIGH',
          userId: user.id,
          message: `Minimum balance requirement has increased to ${newRequirement} AISTM7 tokens. ` +
                  `Your current balance of ${user.balance} tokens will be below the requirement. ` +
                  `You have 72 hours to increase your balance.`,
          data: {
            currentBalance: user.balance,
            newRequirement,
            gracePeriodHours: 72
          }
        });
      }
    } catch (error) {
      logger.error('Failed to notify affected users:', error);
      throw error;
    }
  }

  async createGracePeriod(userId, currentBalance, requirement) {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + this.gracePeriodDuration);

      await db.query(
        `INSERT INTO user_grace_periods (
          user_id,
          start_date,
          end_date,
          initial_balance,
          required_balance,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, startDate, endDate, currentBalance, requirement, 'active']
      );
    } catch (error) {
      logger.error('Failed to create grace period:', error);
      throw error;
    }
  }

  async checkUserAccess(userId) {
    try {
      // Get user's current balance
      const balanceResult = await db.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      if (!balanceResult.rows.length) {
        throw new Error('Wallet not found for user');
      }

      const balance = balanceResult.rows[0].balance;

      // Check if balance meets requirement
      if (balance >= this.currentRequirement) {
        return { hasAccess: true };
      }

      // Check for active grace period
      const gracePeriod = await db.query(
        `SELECT * FROM user_grace_periods
         WHERE user_id = $1
         AND status = 'active'
         AND end_date > NOW()
         ORDER BY end_date DESC
         LIMIT 1`,
        [userId]
      );

      if (gracePeriod.rows.length > 0) {
        return {
          hasAccess: true,
          gracePeriod: {
            endDate: gracePeriod.rows[0].end_date,
            requiredBalance: gracePeriod.rows[0].required_balance
          }
        };
      }

      return { hasAccess: false };
    } catch (error) {
      logger.error('Failed to check user access:', error);
      throw error;
    }
  }

  // Public methods for external use
  async getCurrentRequirement() {
    try {
      // Try cache first
      const cached = await redis.get('aistm7:balance_requirement');
      if (cached) {
        return JSON.parse(cached);
      }

      // Return current requirement from memory
      return {
        requirement: this.currentRequirement,
        timestamp: this.lastUpdate,
        price: await tokenPriceService.getCurrentPrice()
      };
    } catch (error) {
      logger.error('Failed to get current requirement:', error);
      throw error;
    }
  }

  async getRequirementHistory(duration = '7d') {
    try {
      const endTime = new Date();
      let startTime;

      switch (duration) {
        case '24h':
          startTime = new Date(endTime.getTime() - 86400000);
          break;
        case '7d':
          startTime = new Date(endTime.getTime() - 604800000);
          break;
        case '30d':
          startTime = new Date(endTime.getTime() - 2592000000);
          break;
        default:
          throw new Error('Invalid duration');
      }

      const result = await db.query(
        `SELECT requirement, token_price, usd_target, timestamp, reason
         FROM balance_requirement_history
         WHERE timestamp >= $1
         ORDER BY timestamp ASC`,
        [startTime]
      );

      return result.rows;
    } catch (error) {
      logger.error('Failed to get requirement history:', error);
      throw error;
    }
  }
}

module.exports = new BalanceRequirementService();