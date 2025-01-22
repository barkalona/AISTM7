const { Connection, PublicKey } = require('@solana/web3.js');
const { aiService } = require('./aiService');
const { riskAnalysis } = require('./riskAnalysis');
const { portfolioOptimization } = require('./portfolioOptimization');
const { notificationService } = require('./notificationService');
const { alertService } = require('./alertService');
const { tradeService } = require('./tradeService');
const { ibkrService } = require('./ibkrService');
const { solanaService } = require('./solanaService');

class AutomationService {
  constructor() {
    this.initialized = false;
    this.requiredTokenBalance = 700000;
    this.minimumUsdValue = 20; // $20 USD minimum value
  }

  async initialize(userId, walletAddress, ibkrCredentials) {
    try {
      // 1. Verify Solana wallet and token balance
      const isValidWallet = await this.validateWalletAndBalance(walletAddress);
      if (!isValidWallet) {
        throw new Error('Invalid wallet or insufficient AISTM7 token balance');
      }

      // 2. Initialize IBKR connection
      const ibkrConnection = await this.initializeIBKR(ibkrCredentials);
      if (!ibkrConnection) {
        throw new Error('Failed to establish IBKR connection');
      }

      // 3. Initialize AI models and services
      await this.initializeAIServices(userId);

      // 4. Set up automated monitoring and alerts
      await this.setupAutomatedMonitoring(userId);

      // 5. Configure default risk parameters
      await this.configureRiskParameters(userId);

      // 6. Initialize portfolio optimization
      await this.initializePortfolioOptimization(userId);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Automation service initialization failed:', error);
      throw error;
    }
  }

  async validateWalletAndBalance(walletAddress) {
    try {
      const tokenBalance = await solanaService.getTokenBalance(walletAddress);
      const tokenPrice = await solanaService.getTokenPrice();
      
      // Calculate USD value of tokens
      const usdValue = tokenBalance * tokenPrice;
      
      // Adjust required balance based on token price to maintain $20 minimum
      const adjustedRequiredBalance = Math.min(
        this.requiredTokenBalance,
        (this.minimumUsdValue / tokenPrice)
      );

      return tokenBalance >= adjustedRequiredBalance;
    } catch (error) {
      console.error('Wallet validation failed:', error);
      return false;
    }
  }

  async initializeIBKR(credentials) {
    try {
      const connection = await ibkrService.connect(credentials);
      await ibkrService.setupDefaultParameters();
      return connection;
    } catch (error) {
      console.error('IBKR initialization failed:', error);
      throw error;
    }
  }

  async initializeAIServices(userId) {
    try {
      // Initialize AI models with default parameters
      await aiService.initialize({
        riskTolerance: 'moderate',
        tradingStyle: 'balanced',
        timeHorizon: 'medium',
        rebalancingFrequency: 'daily'
      });

      // Set up automated learning processes
      await aiService.setupAutomatedLearning(userId);
    } catch (error) {
      console.error('AI services initialization failed:', error);
      throw error;
    }
  }

  async setupAutomatedMonitoring(userId) {
    try {
      // Configure default alert thresholds
      const defaultAlerts = {
        portfolioDrawdown: -5, // 5% drawdown
        volatilityThreshold: 25, // 25% annualized volatility
        profitTarget: 10, // 10% profit target
        riskExposure: 30 // 30% maximum risk exposure
      };

      await alertService.configureAlerts(userId, defaultAlerts);
      await notificationService.setupDefaultNotifications(userId);

      // Initialize automated monitoring
      await this.startAutomatedMonitoring(userId);
    } catch (error) {
      console.error('Automated monitoring setup failed:', error);
      throw error;
    }
  }

  async configureRiskParameters(userId) {
    try {
      const defaultRiskParams = {
        maxPositionSize: 0.1, // 10% of portfolio
        stopLossPercentage: 0.05, // 5% stop loss
        maxLeverage: 1.5, // 1.5x leverage
        diversificationMinimum: 10 // Minimum number of positions
      };

      await riskAnalysis.setRiskParameters(userId, defaultRiskParams);
    } catch (error) {
      console.error('Risk parameters configuration failed:', error);
      throw error;
    }
  }

  async initializePortfolioOptimization(userId) {
    try {
      const optimizationConfig = {
        rebalancingThreshold: 0.05, // 5% deviation triggers rebalancing
        targetVolatility: 0.15, // 15% target volatility
        minimumPosition: 0.02, // 2% minimum position size
        maximumPosition: 0.2 // 20% maximum position size
      };

      await portfolioOptimization.initialize(userId, optimizationConfig);
      await this.startAutomatedOptimization(userId);
    } catch (error) {
      console.error('Portfolio optimization initialization failed:', error);
      throw error;
    }
  }

  async startAutomatedMonitoring(userId) {
    // Set up periodic monitoring tasks
    setInterval(async () => {
      try {
        await this.runMonitoringCycle(userId);
      } catch (error) {
        console.error('Monitoring cycle failed:', error);
      }
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  async startAutomatedOptimization(userId) {
    // Set up periodic optimization tasks
    setInterval(async () => {
      try {
        await this.runOptimizationCycle(userId);
      } catch (error) {
        console.error('Optimization cycle failed:', error);
      }
    }, 24 * 60 * 60 * 1000); // Run daily
  }

  async runMonitoringCycle(userId) {
    try {
      // 1. Update portfolio data
      const portfolioData = await ibkrService.getPortfolioData(userId);
      
      // 2. Run risk analysis
      const riskMetrics = await riskAnalysis.analyzeRisk(portfolioData);
      
      // 3. Check for alert conditions
      await alertService.checkAlertConditions(userId, riskMetrics);
      
      // 4. Generate AI insights
      await aiService.generateInsights(userId, portfolioData, riskMetrics);
      
      // 5. Execute automated trades if necessary
      await tradeService.executeAutomatedTrades(userId, portfolioData, riskMetrics);
    } catch (error) {
      console.error('Monitoring cycle error:', error);
      await notificationService.sendErrorNotification(userId, error);
    }
  }

  async runOptimizationCycle(userId) {
    try {
      // 1. Get current portfolio state
      const portfolioData = await ibkrService.getPortfolioData(userId);
      
      // 2. Generate optimization recommendations
      const recommendations = await portfolioOptimization.generateRecommendations(
        userId,
        portfolioData
      );
      
      // 3. Execute optimization trades
      if (recommendations.requiresRebalancing) {
        await tradeService.executeOptimizationTrades(userId, recommendations);
      }
    } catch (error) {
      console.error('Optimization cycle error:', error);
      await notificationService.sendErrorNotification(userId, error);
    }
  }
}

module.exports = new AutomationService();