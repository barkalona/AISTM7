const mongoose = require('mongoose');

const AutomationSettingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  walletAddress: {
    type: String,
    required: true
  },
  ibkrCredentialsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IBKRCredentials',
    required: true
  },
  status: {
    type: String,
    enum: ['initializing', 'active', 'paused', 'error'],
    default: 'initializing'
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  lastError: {
    message: String,
    timestamp: Date,
    code: String
  },
  metrics: {
    lastPortfolioUpdate: Date,
    lastRiskAnalysis: Date,
    lastOptimization: Date,
    lastTradeExecution: Date,
    successfulTrades: {
      type: Number,
      default: 0
    },
    failedTrades: {
      type: Number,
      default: 0
    }
  },
  riskParameters: {
    maxPositionSize: {
      type: Number,
      default: 0.1 // 10% of portfolio
    },
    stopLossPercentage: {
      type: Number,
      default: 0.05 // 5% stop loss
    },
    maxLeverage: {
      type: Number,
      default: 1.5 // 1.5x leverage
    },
    diversificationMinimum: {
      type: Number,
      default: 10 // Minimum number of positions
    }
  },
  alertSettings: {
    portfolioDrawdown: {
      type: Number,
      default: -5 // 5% drawdown
    },
    volatilityThreshold: {
      type: Number,
      default: 25 // 25% annualized volatility
    },
    profitTarget: {
      type: Number,
      default: 10 // 10% profit target
    },
    riskExposure: {
      type: Number,
      default: 30 // 30% maximum risk exposure
    }
  },
  optimizationSettings: {
    rebalancingThreshold: {
      type: Number,
      default: 0.05 // 5% deviation triggers rebalancing
    },
    targetVolatility: {
      type: Number,
      default: 0.15 // 15% target volatility
    },
    minimumPosition: {
      type: Number,
      default: 0.02 // 2% minimum position size
    },
    maximumPosition: {
      type: Number,
      default: 0.2 // 20% maximum position size
    }
  },
  aiSettings: {
    riskTolerance: {
      type: String,
      enum: ['conservative', 'moderate', 'aggressive'],
      default: 'moderate'
    },
    tradingStyle: {
      type: String,
      enum: ['passive', 'balanced', 'active'],
      default: 'balanced'
    },
    timeHorizon: {
      type: String,
      enum: ['short', 'medium', 'long'],
      default: 'medium'
    },
    rebalancingFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily'
    }
  }
}, {
  timestamps: true
});

// Indexes
AutomationSettingsSchema.index({ userId: 1 });
AutomationSettingsSchema.index({ walletAddress: 1 });
AutomationSettingsSchema.index({ status: 1 });

// Methods
AutomationSettingsSchema.methods.updateStatus = async function(status, error = null) {
  this.status = status;
  if (error) {
    this.lastError = {
      message: error.message,
      timestamp: new Date(),
      code: error.code
    };
  }
  return this.save();
};

AutomationSettingsSchema.methods.updateMetrics = async function(metricType, value) {
  if (this.metrics[metricType] !== undefined) {
    this.metrics[metricType] = value;
    return this.save();
  }
  throw new Error(`Invalid metric type: ${metricType}`);
};

AutomationSettingsSchema.methods.pause = async function() {
  this.status = 'paused';
  this.isEnabled = false;
  return this.save();
};

AutomationSettingsSchema.methods.resume = async function() {
  this.status = 'active';
  this.isEnabled = true;
  return this.save();
};

// Statics
AutomationSettingsSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId });
};

AutomationSettingsSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ walletAddress });
};

const AutomationSettings = mongoose.model('AutomationSettings', AutomationSettingsSchema);

module.exports = AutomationSettings;