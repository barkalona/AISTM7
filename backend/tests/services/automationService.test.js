const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const automationService = require('../../services/automationService');
const AutomationSettings = require('../../models/automation');
const { validateWalletAddress } = require('../../utils/validation');
const { encryptCredentials } = require('../../utils/encryption');
const ibkrService = require('../../services/ibkrService');
const solanaService = require('../../services/solanaService');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await AutomationSettings.deleteMany({});
  jest.clearAllMocks();
});

// Mock external services
jest.mock('../../services/ibkrService');
jest.mock('../../services/solanaService');
jest.mock('../../utils/validation');
jest.mock('../../utils/encryption');

describe('AutomationService', () => {
  const mockUserId = 'user123';
  const mockWalletAddress = 'solana123';
  const mockIbkrCredentials = {
    username: 'testuser',
    password: 'testpass'
  };

  describe('initialize', () => {
    beforeEach(() => {
      validateWalletAddress.mockResolvedValue(true);
      solanaService.getTokenBalance.mockResolvedValue(700000);
      solanaService.getTokenPrice.mockResolvedValue(0.00003); // $21 worth of tokens
      ibkrService.connect.mockResolvedValue(true);
    });

    it('should successfully initialize automation for valid inputs', async () => {
      const result = await automationService.initialize(
        mockUserId,
        mockWalletAddress,
        mockIbkrCredentials
      );

      expect(result).toBe(true);
      const settings = await AutomationSettings.findOne({ userId: mockUserId });
      expect(settings).toBeTruthy();
      expect(settings.status).toBe('active');
    });

    it('should fail initialization for insufficient token balance', async () => {
      solanaService.getTokenBalance.mockResolvedValue(500000);

      await expect(
        automationService.initialize(mockUserId, mockWalletAddress, mockIbkrCredentials)
      ).rejects.toThrow('Invalid wallet or insufficient AISTM7 token balance');
    });

    it('should fail initialization for invalid IBKR credentials', async () => {
      ibkrService.connect.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        automationService.initialize(mockUserId, mockWalletAddress, mockIbkrCredentials)
      ).rejects.toThrow('Failed to establish IBKR connection');
    });
  });

  describe('monitoring and optimization cycles', () => {
    let automationSettings;

    beforeEach(async () => {
      automationSettings = await AutomationSettings.create({
        userId: mockUserId,
        walletAddress: mockWalletAddress,
        ibkrCredentialsId: new mongoose.Types.ObjectId(),
        status: 'active'
      });
    });

    it('should successfully run monitoring cycle', async () => {
      ibkrService.getPortfolioData.mockResolvedValue({
        positions: [],
        balance: 10000
      });

      await automationService.runMonitoringCycle(mockUserId);
      const updated = await AutomationSettings.findById(automationSettings._id);
      expect(updated.metrics.lastPortfolioUpdate).toBeTruthy();
    });

    it('should successfully run optimization cycle', async () => {
      ibkrService.getPortfolioData.mockResolvedValue({
        positions: [],
        balance: 10000
      });

      await automationService.runOptimizationCycle(mockUserId);
      const updated = await AutomationSettings.findById(automationSettings._id);
      expect(updated.metrics.lastOptimization).toBeTruthy();
    });

    it('should handle errors during monitoring cycle', async () => {
      ibkrService.getPortfolioData.mockRejectedValue(new Error('API error'));

      await automationService.runMonitoringCycle(mockUserId);
      const updated = await AutomationSettings.findById(automationSettings._id);
      expect(updated.lastError).toBeTruthy();
      expect(updated.status).toBe('error');
    });
  });

  describe('automation control', () => {
    let automationSettings;

    beforeEach(async () => {
      automationSettings = await AutomationSettings.create({
        userId: mockUserId,
        walletAddress: mockWalletAddress,
        ibkrCredentialsId: new mongoose.Types.ObjectId(),
        status: 'active'
      });
    });

    it('should successfully pause automation', async () => {
      await automationService.pause(mockUserId);
      const updated = await AutomationSettings.findById(automationSettings._id);
      expect(updated.status).toBe('paused');
      expect(updated.isEnabled).toBe(false);
    });

    it('should successfully resume automation', async () => {
      await automationService.pause(mockUserId);
      await automationService.resume(mockUserId);
      const updated = await AutomationSettings.findById(automationSettings._id);
      expect(updated.status).toBe('active');
      expect(updated.isEnabled).toBe(true);
    });
  });

  describe('token balance adjustment', () => {
    it('should adjust required balance based on token price', async () => {
      // Set token price to make 700,000 tokens worth $30
      solanaService.getTokenPrice.mockResolvedValue(0.0000428); // $30/700000

      const result = await automationService.validateWalletAndBalance(mockWalletAddress);
      expect(result).toBe(true);

      // Verify that a lower balance is accepted when token price is higher
      solanaService.getTokenBalance.mockResolvedValue(500000);
      solanaService.getTokenPrice.mockResolvedValue(0.00006); // $30/500000
      const result2 = await automationService.validateWalletAndBalance(mockWalletAddress);
      expect(result2).toBe(true);
    });
  });

  describe('error handling and recovery', () => {
    let automationSettings;

    beforeEach(async () => {
      automationSettings = await AutomationSettings.create({
        userId: mockUserId,
        walletAddress: mockWalletAddress,
        ibkrCredentialsId: new mongoose.Types.ObjectId(),
        status: 'active'
      });
    });

    it('should handle IBKR connection errors gracefully', async () => {
      ibkrService.connect.mockRejectedValue(new Error('Connection failed'));

      await automationService.runMonitoringCycle(mockUserId);
      const updated = await AutomationSettings.findById(automationSettings._id);
      expect(updated.lastError).toBeTruthy();
      expect(updated.status).toBe('error');
    });

    it('should attempt recovery after error state', async () => {
      // First cause an error
      ibkrService.connect.mockRejectedValue(new Error('Connection failed'));
      await automationService.runMonitoringCycle(mockUserId);

      // Then simulate successful recovery
      ibkrService.connect.mockResolvedValue(true);
      await automationService.resume(mockUserId);
      
      const updated = await AutomationSettings.findById(automationSettings._id);
      expect(updated.status).toBe('active');
      expect(updated.lastError).toBeTruthy(); // Error history is maintained
    });
  });
});