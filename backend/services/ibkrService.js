const axios = require('axios');
const IBKRCredentials = require('../models/ibkrCredentials');

class IBKRService {
  constructor() {
    this.sessions = new Map(); // Store active sessions by userId
    this.webSockets = new Map(); // Store WebSocket connections by userId
    this.marketDataSubscriptions = new Map(); // Store market data subscriptions by userId
    
    // Validate required environment variables
    if (!process.env.IBKR_API_ENDPOINT) {
      throw new Error('IBKR_API_ENDPOINT environment variable is required');
    }
    
    this.apiEndpoint = process.env.IBKR_API_ENDPOINT;
  }

  async createClient(userId) {
    try {
      const credentials = await IBKRCredentials.findOne({ userId });
      if (!credentials) {
        throw new Error('IBKR credentials not found');
      }

      const { username, password } = credentials;
      if (!username || !password) {
        throw new Error('Invalid IBKR credentials');
      }
      
      return axios.create({
        baseURL: this.apiEndpoint,
        auth: { username, password },
        headers: {
          'User-Agent': 'AISTM7/1.0.0',
          'Content-Type': 'application/json'
        },
        validateStatus: status => status < 500 // Don't throw on 4xx errors
      });
    } catch (error) {
      console.error('Error creating IBKR client:', error);
      await this.updateConnectionStatus(userId, 'error', error.message);
      throw error;
    }
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
        baseURL: this.apiEndpoint,
        auth: { username, password }
      });

      const response = await testClient.post('/iserver/auth/status');
      
      const result = {
        success: response.data.authenticated,
        error: response.data.authenticated ? null : 'Authentication failed'
      };

      return result;
    } catch (error) {
      console.error('IBKR connection test failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async updateConnectionStatus(userId, status, error = null) {
    try {
      await IBKRCredentials.findOneAndUpdate(
        { userId },
        { 
          connectionStatus: status,
          lastError: error,
          lastSync: new Date()
        }
      );
    } catch (dbError) {
      console.error('Error updating connection status:', dbError);
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

      // Update connection status
      await this.updateConnectionStatus(userId, 'connected');

      return true;
    } catch (error) {
      console.error('Failed to initialize IBKR session:', error);
      await this.updateConnectionStatus(userId, 'error', error.message);
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
        
        // Update connection status
        await this.updateConnectionStatus(userId, 'disconnected');
      }
    } catch (error) {
      console.error('Error closing IBKR session:', error);
      throw error;
    }
  }

  // WebSocket Management
  addWebSocket(userId, ws) {
    this.webSockets.set(userId, ws);
  }

  removeWebSocket(userId) {
    this.webSockets.delete(userId);
    // Clean up market data subscriptions when WebSocket closes
    this.unsubscribeAllMarketData(userId);
  }

  // Market Data Subscription
  async subscribeMarketData(userId, contractIds) {
    try {
      const client = await this.getClient(userId);
      const subscriptions = [];

      for (const contractId of contractIds) {
        const response = await client.post('/iserver/marketdata/snapshot', {
          conid: contractId,
          fields: ['31', '83', '84', '85', '86', '88'] // Bid, Ask, Last, Volume, etc.
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
        }
      }

      // Start market data polling for this user
      this.startMarketDataPolling(userId);

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

      for (const contractId of contractIds) {
        const subscriptionId = userSubscriptions.get(contractId);
        if (subscriptionId) {
          await client.delete(`/iserver/marketdata/${subscriptionId}`);
          userSubscriptions.delete(contractId);
        }
      }

      // If no more subscriptions, stop polling
      if (userSubscriptions.size === 0) {
        this.stopMarketDataPolling(userId);
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

  // Market Data Polling with error handling and retry logic
  startMarketDataPolling(userId) {
    if (this.sessions.has(`${userId}_marketdata_polling`)) return;

    let consecutiveErrors = 0;
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds

    const interval = setInterval(async () => {
      try {
        const userSubscriptions = this.marketDataSubscriptions.get(userId);
        if (!userSubscriptions || userSubscriptions.size === 0) {
          this.stopMarketDataPolling(userId);
          return;
        }

        const client = await this.getClient(userId);
        const ws = this.webSockets.get(userId);

        for (const [contractId, subscriptionId] of userSubscriptions) {
          const response = await client.get(`/iserver/marketdata/snapshot`, {
            params: {
              conid: contractId,
              fields: ['31', '83', '84', '85', '86', '88']
            }
          });

          if (ws && ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify({
              type: 'marketData',
              contractId,
              data: response.data
            }));
          }
        }
        
        // Reset error counter on successful poll
        consecutiveErrors = 0;
      } catch (error) {
        console.error('Error polling market data:', error);
        consecutiveErrors++;

        if (consecutiveErrors >= maxRetries) {
          console.error(`Max retries (${maxRetries}) reached for market data polling. Stopping.`);
          this.stopMarketDataPolling(userId);
          this.updateConnectionStatus(userId, 'error', 'Market data polling failed');
        } else {
          // Wait before next retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }, 1000); // Poll every second

    this.sessions.set(`${userId}_marketdata_polling`, interval);
  }

  stopMarketDataPolling(userId) {
    const intervalId = this.sessions.get(`${userId}_marketdata_polling`);
    if (intervalId) {
      clearInterval(intervalId);
      this.sessions.delete(`${userId}_marketdata_polling`);
    }
  }

  // Portfolio Operations with improved error handling
  async getPortfolio(userId) {
    try {
      const client = await this.getClient(userId);
      const response = await client.get('/portfolio/accounts');
      return response.data;
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      await this.updateConnectionStatus(userId, 'error', 'Failed to fetch portfolio data');
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
      await this.updateConnectionStatus(userId, 'error', 'Failed to fetch account summary');
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
      await this.updateConnectionStatus(userId, 'error', 'Failed to fetch positions');
      throw error;
    }
  }

  // Session keepalive with improved error handling
  startKeepAlive(userId) {
    let consecutiveErrors = 0;
    const maxErrors = 3;

    const interval = setInterval(async () => {
      try {
        const client = this.sessions.get(userId);
        if (client) {
          await client.post('/tickle');
          consecutiveErrors = 0; // Reset error counter on success
        } else {
          this.stopKeepAlive(userId);
        }
      } catch (error) {
        console.error('Keepalive failed for user:', userId, error);
        consecutiveErrors++;

        if (consecutiveErrors >= maxErrors) {
          console.error(`Keepalive failed ${maxErrors} times, closing session`);
          this.stopKeepAlive(userId);
          this.closeSession(userId).catch(console.error);
        }
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