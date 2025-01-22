const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thresholds: {
    valueAtRisk: Number,
    portfolioDrawdown: Number,
    marginUtilization: Number,
    positionConcentration: Number
  },
  notificationChannels: {
    email: {
      type: Boolean,
      default: false
    },
    sms: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  lastTriggered: Date,
  triggerCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
alertSchema.index({ userId: 1 });

module.exports = mongoose.model('Alert', alertSchema);