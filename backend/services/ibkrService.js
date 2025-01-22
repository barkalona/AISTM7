const axios = require('axios');
const IBKRCredentials = require('../models/ibkrCredentials');

class IBKRService {
  constructor() {
    this.sessions = new Map(); // Store active sessions by userId
    this.webSockets = new Map(); // Store WebSocket connections by userId
    this.marketDataSubscriptions = new Map(); // Store market data subscriptions by userId
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

  // Market Data Polling
  startMarketDataPolling(userId) {
    if (this.sessions.has(`${userId}_marketdata_polling`)) return;

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
      } catch (error) {
        console.error('Error polling market data:', error);
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