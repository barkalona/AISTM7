const axios = require('axios');
const IBKRCredentials = require('../models/ibkrCredentials');
const wsManager = require('./websocketManager');
const marketDataManager = require('./marketDataManager');
const EventEmitter = require('events');

class IBKRService extends EventEmitter {
  constructor() {
    super();
    this.sessions = new Map(); // Store active sessions by userId
    this.marketDataSubscriptions = new Map(); // Store market data subscriptions by userId
    
    // Handle WebSocket reconnection
    wsManager.on('reconnect', this.handleReconnect.bind(this));
    wsManager.on('max_reconnect_attempts', this.handleMaxReconnectAttempts.bind(this));
  }

  async createClient(userId) {
    const credentials = await IBKRCredentials.findOne({ userId });
    if (!credentials) {
      throw new Error('IBKR credentials not found');
    }

    const { username, password } = await credentials.decryptCredentials();
    
    return axios.create({
      baseURL: 'https://localhost:5000/v1/api',
      auth: { username, password },
      headers: {
        'User-Agent': 'AISTM7/1.0.0',
        'Content-Type': 'application/json'
      },
      validateStatus: status => status < 500 // Don't throw on 4xx errors
    });
  }

  async getClient(userId) {
    if (!this.sessions.has(userId)) {
      await this.initializeSession(userId);
    }
    return this.sessions.get(userId);
  }

  async testConnection(username, password) {
    try {
      const testClient = axios.create({
        baseURL: 'https://localhost:5000/v1/api',
        auth: { username, password }
      });

      const response = await testClient.post('/iserver/auth/status');
      
      if (response.data.authenticated) {
        return { success: true };
      } else {
        return { 
          success: false,
          error: 'Authentication failed'
        };
      }
    } catch (error) {
      console.error('IBKR connection test failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async initializeSession(userId) {
    try {
      const client = await this.createClient(userId);
      
      // Authenticate with IBKR
      const authResponse = await client.post('/iserver/auth/status');
      if (!authResponse.data.authenticated) {
        throw new Error('Failed to authenticate with IBKR');
      }

      // Store the authenticated client
      this.sessions.set(userId, client);

      // Start session keepalive
      this.startKeepAlive(userId);

      return true;
    } catch (error) {
      console.error('Failed to initialize IBKR session:', error);
      throw error;
    }
  }

  async closeSession(userId) {
    try {
      const client = this.sessions.get(userId);
      if (client) {
        // Unsubscribe from all market data
        await this.unsubscribeAllMarketData(userId);
        
        // Logout from IBKR
        await client.post('/logout');
        this.sessions.delete(userId);
        this.stopKeepAlive(userId);
      }
    } catch (error) {
      console.error('Error closing IBKR session:', error);
      throw error;
    }
  }

  // WebSocket Management
  addWebSocket(userId, ws) {
    wsManager.addConnection(userId, ws);
    
    // Restore any cached market data
    const userSubscriptions = this.marketDataSubscriptions.get(userId);
    if (userSubscriptions) {
      for (const contractId of userSubscriptions.keys()) {
        const cachedData = marketDataManager.getCachedData(contractId);
        if (cachedData) {
          wsManager.sendMessage(userId, {
            type: 'marketData',
            contractId,
            data: cachedData
          });
        }
      }
    }
  }

  removeWebSocket(userId) {
    wsManager.removeConnection(userId);
    this.unsubscribeAllMarketData(userId);
  }

  // Handle WebSocket reconnection
  async handleReconnect(userId) {
    try {
      // Verify session is still valid
      const client = await this.getClient(userId);
      const authResponse = await client.post('/iserver/auth/status');
      
      if (!authResponse.data.authenticated) {
        await this.initializeSession(userId);
      }

      // Resubscribe to market data
      const userSubscriptions = this.marketDataSubscriptions.get(userId);
      if (userSubscriptions) {
        const contractIds = Array.from(userSubscriptions.keys());
        await this.subscribeMarketData(userId, contractIds);
      }
    } catch (error) {
      console.error('Error handling reconnection:', error);
    }
  }

  handleMaxReconnectAttempts(userId) {
    this.emit('connection_failed', userId);
    this.closeSession(userId);
  }

  // Market Data Subscription
  async subscribeMarketData(userId, contractIds) {
    try {
      const client = await this.getClient(userId);
      const subscriptions = [];

      // Batch subscribe requests
      const batchSize = 10;
      for (let i = 0; i < contractIds.length; i += batchSize) {
        const batch = contractIds.slice(i, i + batchSize);
        const promises = batch.map(async (contractId) => {
          try {
            const response = await client.post('/iserver/marketdata/snapshot', {
              conid: contractId,
              fields: ['31', '83', '84', '85', '86', '88']
            });

            if (response.data.success) {
              subscriptions.push({
                contractId,
                subscriptionId: response.data.subscriptionId
              });

              // Store subscription
              if (!this.marketDataSubscriptions.has(userId)) {
                this.marketDataSubscriptions.set(userId, new Map());
              }
              this.marketDataSubscriptions.get(userId).set(contractId, response.data.subscriptionId);

              // Initialize market data cache
              marketDataManager.queueUpdate(contractId, response.data);
            }
          } catch (error) {
            console.error(`Error subscribing to contract ${contractId}:`, error);
          }
        });

        await Promise.all(promises);
      }

      // Start adaptive polling for this user
      this.startAdaptivePolling(userId);

      return subscriptions;
    } catch (error) {
      console.error('Error subscribing to market data:', error);
      throw error;
    }
  }

  async unsubscribeMarketData(userId, contractIds) {
    try {
      const client = await this.getClient(userId);
      const userSubscriptions = this.marketDataSubscriptions.get(userId);

      if (!userSubscriptions) return;

      // Batch unsubscribe requests
      const batchSize = 10;
      for (let i = 0; i < contractIds.length; i += batchSize) {
        const batch = contractIds.slice(i, i + batchSize);
        const promises = batch.map(async (contractId) => {
          const subscriptionId = userSubscriptions.get(contractId);
          if (subscriptionId) {
            try {
              await client.delete(`/iserver/marketdata/${subscriptionId}`);
              userSubscriptions.delete(contractId);
              marketDataManager.clearContract(contractId);
            } catch (error) {
              console.error(`Error unsubscribing from contract ${contractId}:`, error);
            }
          }
        });

        await Promise.all(promises);
      }

      // If no more subscriptions, stop polling
      if (userSubscriptions.size === 0) {
        this.stopAdaptivePolling(userId);
      }
    } catch (error) {
      console.error('Error unsubscribing from market data:', error);
      throw error;
    }
  }

  async unsubscribeAllMarketData(userId) {
    const userSubscriptions = this.marketDataSubscriptions.get(userId);
    if (userSubscriptions) {
      const contractIds = Array.from(userSubscriptions.keys());
      await this.unsubscribeMarketData(userId, contractIds);
      this.marketDataSubscriptions.delete(userId);
    }
  }

  // Adaptive Market Data Polling
  startAdaptivePolling(userId) {
    if (this.sessions.has(`${userId}_marketdata_polling`)) return;

    const pollMarketData = async () => {
      try {
        const userSubscriptions = this.marketDataSubscriptions.get(userId);
        if (!userSubscriptions || userSubscriptions.size === 0) {
          this.stopAdaptivePolling(userId);
          return;
        }

        const client = await this.getClient(userId);

        // Group contracts by polling interval
        const contractsByInterval = new Map();
        for (const [contractId] of userSubscriptions) {
          const interval = marketDataManager.calculatePollingInterval(contractId);
          if (!contractsByInterval.has(interval)) {
            contractsByInterval.set(interval, []);
          }
          contractsByInterval.get(interval).push(contractId);
        }

        // Schedule polling for each interval group
        for (const [interval, contracts] of contractsByInterval) {
          if (!this.sessions.has(`${userId}_${interval}_polling`)) {
            const intervalId = setInterval(async () => {
              // Batch requests for this interval
              const batchSize = 10;
              for (let i = 0; i < contracts.length; i += batchSize) {
                const batch = contracts.slice(i, i + batchSize);
                const promises = batch.map(async (contractId) => {
                  try {
                    const response = await client.get(`/iserver/marketdata/snapshot`, {
                      params: {
                        conid: contractId,
                        fields: ['31', '83', '84', '85', '86', '88']
                      }
                    });

                    marketDataManager.queueUpdate(contractId, response.data);
                  } catch (error) {
                    console.error(`Error polling contract ${contractId}:`, error);
                  }
                });

                await Promise.all(promises);
              }
            }, interval);

            this.sessions.set(`${userId}_${interval}_polling`, intervalId);
          }
        }

        // Clean up unused intervals
        for (const [key, intervalId] of this.sessions) {
          if (key.startsWith(`${userId}_`) && key.endsWith('_polling')) {
            const interval = parseInt(key.split('_')[1]);
            if (!contractsByInterval.has(interval)) {
              clearInterval(intervalId);
              this.sessions.delete(key);
            }
          }
        }
      } catch (error) {
        console.error('Error in adaptive polling:', error);
      }
    };

    // Initial poll and setup
    pollMarketData();

    // Listen for market data updates
    marketDataManager.on('updates', (updates) => {
      const state = wsManager.getConnectionState(userId);
      if (state === 'connected') {
        wsManager.sendMessage(userId, {
          type: 'marketData',
          updates
        });
      }
    });
  }

  stopAdaptivePolling(userId) {
    // Clear all polling intervals for this user
    for (const [key, intervalId] of this.sessions) {
      if (key.startsWith(`${userId}_`) && key.endsWith('_polling')) {
        clearInterval(intervalId);
        this.sessions.delete(key);
      }
    }
  }

  // Portfolio Operations
  async getPortfolio(userId) {
    try {
      const client = await this.getClient(userId);
      const response = await client.get('/portfolio/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      throw error;
    }
  }

  async getHistoricalData(userId, contractId, period, barSize) {
    try {
      const client = await this.getClient(userId);
      const response = await client.get(`/iserver/marketdata/history`, {
        params: {
          conid: contractId,
          period,
          bar: barSize
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  async getAccountSummary(userId, accountId) {
    try {
      const client = await this.getClient(userId);
      const response = await client.get(`/portfolio/${accountId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account summary:', error);
      throw error;
    }
  }

  async getPositions(userId, accountId) {
    try {
      const client = await this.getClient(userId);
      const response = await client.get(`/portfolio/${accountId}/positions`);
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error;
    }
  }

  // Session keepalive
  startKeepAlive(userId) {
    const interval = setInterval(async () => {
      try {
        const client = this.sessions.get(userId);
        if (client) {
          await client.post('/tickle');
        } else {
          this.stopKeepAlive(userId);
        }
      } catch (error) {
        console.error('Keepalive failed for user:', userId, error);
        this.stopKeepAlive(userId);
      }
    }, 45000); // Ping every 45 seconds

    this.sessions.set(`${userId}_keepalive`, interval);
  }

  stopKeepAlive(userId) {
    const intervalId = this.sessions.get(`${userId}_keepalive`);
    if (intervalId) {
      clearInterval(intervalId);
      this.sessions.delete(`${userId}_keepalive`);
    }
  }
}

module.exports = new IBKRService();