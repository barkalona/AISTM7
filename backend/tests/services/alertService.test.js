const AlertService = require('../../services/alertService');
const NotificationService = require('../../services/notificationService');
const prisma = require('../../utils/db');

// Mock dependencies
jest.mock('../../services/notificationService');
jest.mock('../../utils/db');

describe('AlertService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockPortfolio = {
    id: 'portfolio-123',
    userId: mockUser.id,
    positions: [
      { quantity: 10, currentPrice: 100 },
      { quantity: 5, currentPrice: 200 },
    ],
  };

  const mockAlert = {
    id: 'alert-123',
    userId: mockUser.id,
    type: 'RISK_LEVEL',
    threshold: 70,
    message: 'Risk level too high',
    active: true,
    user: mockUser,
    portfolio: mockPortfolio,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock prisma methods
    prisma.alert.findMany.mockResolvedValue([mockAlert]);
    prisma.alert.create.mockResolvedValue(mockAlert);
    prisma.alert.update.mockResolvedValue(mockAlert);
    prisma.alert.delete.mockResolvedValue(mockAlert);
    prisma.portfolio.findUnique.mockResolvedValue(mockPortfolio);
    prisma.alertLog.create.mockResolvedValue({});

    // Mock notification service
    NotificationService.sendRiskAlert.mockResolvedValue(true);
  });

  describe('Alert Monitoring', () => {
    it('should start monitoring when called', async () => {
      expect(AlertService.isRunning).toBe(false);
      await AlertService.startMonitoring();
      expect(AlertService.isRunning).toBe(true);
    });

    it('should stop monitoring when called', async () => {
      AlertService.isRunning = true;
      await AlertService.stopMonitoring();
      expect(AlertService.isRunning).toBe(false);
    });
  });

  describe('Alert Processing', () => {
    it('should process alerts and trigger notifications when thresholds are exceeded', async () => {
      // Mock risk metrics calculation to trigger alert
      jest.spyOn(AlertService, 'calculateRiskLevel').mockResolvedValue(80);
      
      await AlertService.processAlert(mockAlert);

      expect(NotificationService.sendRiskAlert).toHaveBeenCalledWith(
        mockUser,
        mockPortfolio,
        expect.objectContaining({
          riskLevel: expect.any(Number),
          valueAtRisk: expect.any(Number),
        })
      );

      expect(prisma.alert.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockAlert.id },
          data: expect.objectContaining({
            lastTriggered: expect.any(Date),
            triggerCount: { increment: 1 },
          }),
        })
      );
    });

    it('should not trigger notifications when thresholds are not exceeded', async () => {
      // Mock risk metrics calculation to not trigger alert
      jest.spyOn(AlertService, 'calculateRiskLevel').mockResolvedValue(50);
      
      await AlertService.processAlert(mockAlert);

      expect(NotificationService.sendRiskAlert).not.toHaveBeenCalled();
      expect(prisma.alert.update).not.toHaveBeenCalled();
    });
  });

  describe('Alert Management', () => {
    it('should create new alerts', async () => {
      const alertData = {
        type: 'PORTFOLIO_VALUE',
        threshold: 100000,
        message: 'Portfolio value alert',
      };

      await AlertService.createAlert(mockUser.id, alertData);

      expect(prisma.alert.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
          type: alertData.type,
          threshold: alertData.threshold,
        }),
      });
    });

    it('should update existing alerts', async () => {
      const updateData = {
        threshold: 80,
        message: 'Updated message',
        active: true,
      };

      await AlertService.updateAlert(mockAlert.id, updateData);

      expect(prisma.alert.update).toHaveBeenCalledWith({
        where: { id: mockAlert.id },
        data: updateData,
      });
    });

    it('should delete alerts', async () => {
      await AlertService.deleteAlert(mockAlert.id);

      expect(prisma.alert.delete).toHaveBeenCalledWith({
        where: { id: mockAlert.id },
      });
    });

    it('should retrieve user alerts', async () => {
      await AlertService.getAlerts(mockUser.id);

      expect(prisma.alert.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('Recommendations', () => {
    it('should generate appropriate recommendations based on alert type', () => {
      const riskLevelRec = AlertService.generateRecommendations('RISK_LEVEL', {});
      expect(riskLevelRec).toContain('rebalancing');

      const volatilityRec = AlertService.generateRecommendations('VOLATILITY', {});
      expect(volatilityRec).toContain('stable assets');

      const valueRec = AlertService.generateRecommendations('PORTFOLIO_VALUE', {});
      expect(valueRec).toContain('strategy');
    });
  });
});