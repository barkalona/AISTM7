const mongoose = require('mongoose');
const { encrypt, decrypt } = require('../utils/encryption');

const ibkrCredentialsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    set: encrypt,
    get: decrypt
  },
  password: {
    type: String,
    required: true,
    set: encrypt,
    get: decrypt
  },
  lastSync: Date,
  connectionStatus: {
    type: String,
    enum: ['connected', 'disconnected', 'error'],
    default: 'disconnected'
  },
  lastError: String
});

// Index for faster queries
ibkrCredentialsSchema.index({ userId: 1 });

// Virtual for connection status
ibkrCredentialsSchema.virtual('isConnected').get(function() {
  return this.connectionStatus === 'connected';
});

module.exports = mongoose.model('IBKRCredentials', ibkrCredentialsSchema);