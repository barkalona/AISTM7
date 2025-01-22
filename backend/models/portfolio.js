const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assets: [{
    symbol: String,
    quantity: Number,
    averageCost: Number,
    currentPrice: Number,
    sector: String,
    assetClass: String
  }],
  positions: [{
    symbol: String,
    positionType: {
      type: String,
      enum: ['long', 'short']
    },
    quantity: Number,
    entryPrice: Number,
    currentPrice: Number,
    pnl: Number
  }],
  margin: {
    available: Number,
    used: Number,
    maintenance: Number
  },
  riskMetrics: {
    valueAtRisk: Number,
    sharpeRatio: Number,
    beta: Number,
    volatility: Number,
    stressTestResults: [{
      scenario: String,
      impact: Number
    }]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
portfolioSchema.index({ userId: 1 });

module.exports = mongoose.model('Portfolio', portfolioSchema);