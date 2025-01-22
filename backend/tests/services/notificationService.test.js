const NotificationService = require('../../services/notificationService');
const { formatCurrency, formatRiskLevel } = require('../../utils/formatting');

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('NotificationService', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockPortfolio = {
    totalValue: 100000,
    dailyChange: 2.5,
  };

  const mockRiskMetrics = {
    riskLevel: 45,
    valueAtRisk: 5000,
    sharpeRatio: 1.2,
    recommendations: 'Consider rebalancing your portfolio.',
  };

  const mockAnalysis = {
    riskAdjustedReturn: 8.5,
    insights: 'Portfolio showing strong momentum.',
    recommendations: 'Consider increasing position in defensive assets.',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendEmail', () => {
    it('should send an email successfully', async () => {
      const result = await NotificationService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test content</p>'
      );
      expect(result).toBe(true);
    });

    it('should handle email sending failure', async () => {
      const transporter = NotificationService.transporter;
      transporter.sendMail.mockRejectedValueOnce(new Error('Send failed'));
      
      const result = await NotificationService.sendEmail(
        'test@example.com',
        'Test Subject',
        '<p>Test content</p>'
      );
      expect(result).toBe(false);
    });
  });

  describe('sendRiskAlert', () => {
    it('should send risk alert email with correct content', async () => {
      const result = await NotificationService.sendRiskAlert(
        mockUser,
        mockPortfolio,
        mockRiskMetrics
      );

      expect(result).toBe(true);
      expect(NotificationService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: expect.stringContaining('Risk Alert'),
          html: expect.stringContaining(formatRiskLevel(mockRiskMetrics.riskLevel)),
        })
      );
    });
  });

  describe('sendPortfolioSummary', () => {
    it('should send portfolio summary email with correct content', async () => {
      const result = await NotificationService.sendPortfolioSummary(
        mockUser,
        mockPortfolio,
        mockAnalysis
      );

      expect(result).toBe(true);
      expect(NotificationService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: expect.stringContaining('Portfolio Summary'),
          html: expect.stringContaining(formatCurrency(mockPortfolio.totalValue)),
        })
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct link', async () => {
      const mockToken = 'test-verification-token';
      const result = await NotificationService.sendVerificationEmail(
        mockUser,
        mockToken
      );

      expect(result).toBe(true);
      expect(NotificationService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: expect.stringContaining('Verify'),
          html: expect.stringContaining(mockToken),
        })
      );
    });
  });

  describe('sendPasswordReset', () => {
    it('should send password reset email with correct link', async () => {
      const mockToken = 'test-reset-token';
      const result = await NotificationService.sendPasswordReset(
        mockUser,
        mockToken
      );

      expect(result).toBe(true);
      expect(NotificationService.transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          subject: expect.stringContaining('Reset'),
          html: expect.stringContaining(mockToken),
        })
      );
    });
  });
});