const LRU = require('lru-cache');
const { throttle } = require('lodash');

class MarketDataManager {
  constructor() {
    // Cache market data with 5 minute TTL
    this.cache = new LRU({
      max: 1000, // Store max 1000 items
      ttl: 1000 * 60 * 5, // 5 minutes
    });

    // Track volatility for adaptive polling
    this.volatility = new Map();
    this.lastPrices = new Map();
    
    // Batch updates
    this.pendingUpdates = new Map();
    this.batchTimeout = null;
    
    // Throttle update broadcasts
    this.broadcastUpdates = throttle(this._broadcastUpdates.bind(this), 100);
  }

  // Calculate adaptive polling interval based on price volatility
  calculatePollingInterval(contractId) {
    const volatility = this.volatility.get(contractId) || 0;
    
    // Base interval is 1000ms (1 second)
    // High volatility -> faster updates (min 200ms)
    // Low volatility -> slower updates (max 5000ms)
    const interval = Math.max(
      200,
      Math.min(5000, Math.floor(1000 / (1 + volatility)))
    );
    
    return interval;
  }

  // Update volatility based on price changes
  updateVolatility(contractId, newPrice) {
    const lastPrice = this.lastPrices.get(contractId);
    if (!lastPrice) {
      this.lastPrices.set(contractId, newPrice);
      return;
    }

    // Calculate price change percentage
    const priceChange = Math.abs((newPrice - lastPrice) / lastPrice);
    
    // Update exponential moving average of volatility
    const currentVolatility = this.volatility.get(contractId) || 0;
    const newVolatility = (currentVolatility * 0.9) + (priceChange * 0.1);
    
    this.volatility.set(contractId, newVolatility);
    this.lastPrices.set(contractId, newPrice);
  }

  // Queue update for batching
  queueUpdate(contractId, data) {
    this.pendingUpdates.set(contractId, data);
    
    // Update volatility
    if (data.last) {
      this.updateVolatility(contractId, data.last);
    }
    
    // Cache the data
    this.cache.set(contractId, data);
    
    // Schedule batch update if not already scheduled
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.broadcastUpdates();
        this.batchTimeout = null;
      }, 100); // Batch updates every 100ms
    }
  }

  // Get cached market data
  getCachedData(contractId) {
    return this.cache.get(contractId);
  }

  // Private method to broadcast batched updates
  _broadcastUpdates() {
    if (this.pendingUpdates.size === 0) return;
    
    // Convert pending updates to array
    const updates = Array.from(this.pendingUpdates.entries()).map(
      ([contractId, data]) => ({
        contractId,
        data,
        timestamp: Date.now()
      })
    );
    
    // Clear pending updates
    this.pendingUpdates.clear();
    
    // Emit batch update event
    this.emit('updates', updates);
  }

  // Clear data for a contract
  clearContract(contractId) {
    this.cache.delete(contractId);
    this.volatility.delete(contractId);
    this.lastPrices.delete(contractId);
    this.pendingUpdates.delete(contractId);
  }

  // Clear all data
  clear() {
    this.cache.clear();
    this.volatility.clear();
    this.lastPrices.clear();
    this.pendingUpdates.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}

module.exports = new MarketDataManager();