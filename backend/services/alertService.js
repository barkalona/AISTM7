const prisma = require('../utils/db');
const notificationService = require('./notificationService');
const { formatRiskLevel } = require('../utils/formatting');

class AlertService {
  constructor() {
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
    this.isRunning = false;
  }

  async startMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.monitor();
  }

  async stopMonitoring() {
    this.isRunning = false;
  }

  async monitor() {
    while (this.isRunning) {
      try {
        await this.checkAlerts();
        await new Promise(resolve => setTimeout(resolve, this.checkInterval));
      } catch (error) {
        console.error('Error in alert monitoring:', error);
      }
    }
  }

  async checkAlerts() {
    const activeAlerts = await prisma.alert.findMany({
      where: { active: true },
      include: {
        user: true,
        portfolio: true,
      },
    });

    for (const alert of activeAlerts) {
      try {
        await this.processAlert(alert);
      } catch (error) {
        console.error(`Error processing alert ${alert.id}:`, error);
      }
    }
  }

  async processAlert(alert) {
    const { type, threshold, user, portfolio } = alert;
    const currentMetrics = await this.getCurrentMetrics(portfolio.id);

    if (this.shouldTriggerAlert(type, threshold, currentMetrics)) {
      await this.triggerAlert(alert, currentMetrics);
    }
  }

  async getCurrentMetrics(portfolioId) {
    // Get current portfolio metrics from risk analysis service
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: true,
      },
    });

    // Calculate current metrics
    return {
      totalValue: portfolio.positions.reduce((sum, pos) => sum + pos.quantity * pos.currentPrice, 0),
      riskLevel: await this.calculateRiskLevel(portfolio),
      volatility: await this.calculateVolatility(portfolio),
    };
  }

  async calculateRiskLevel(portfolio) {
    // Implement risk level calculation logic
    // This should be replaced with actual risk calculation from riskAnalysis service
    return Math.random() * 100; // Placeholder
  }

  async calculateVolatility(portfolio) {
    // Implement volatility calculation logic
    // This should be replaced with actual volatility calculation
    return Math.random() * 0.5; // Placeholder
  }

  shouldTriggerAlert(type, threshold, metrics) {
    switch (type) {
      case 'PRICE':
        return metrics.totalValue <= threshold;
      case 'RISK_LEVEL':
        return metrics.riskLevel >= threshold;
      case 'VOLATILITY':
        return metrics.volatility >= threshold;
      case 'PORTFOLIO_VALUE':
        return metrics.totalValue <= threshold;
      default:
        return false;
    }
  }

  async triggerAlert(alert, metrics) {
    const { user, portfolio } = alert;

    // Send email notification
    await notificationService.sendRiskAlert(user, portfolio, {
      riskLevel: metrics.riskLevel,
      valueAtRisk: metrics.totalValue * metrics.volatility,
      sharpeRatio: 1.5, // Placeholder - should come from risk calculations
      recommendations: this.generateRecommendations(alert.type, metrics),
    });

    // Update alert status
    await prisma.alert.update({
      where: { id: alert.id },
      data: {
        lastTriggered: new Date(),
        triggerCount: { increment: 1 },
      },
    });

    // Log alert trigger
    await prisma.alertLog.create({
      data: {
        alertId: alert.id,
        userId: user.id,
        type: alert.type,
        metrics: metrics,
        timestamp: new Date(),
      },
    });
  }

  generateRecommendations(alertType, metrics) {
    switch (alertType) {
      case 'RISK_LEVEL':
        return `Your portfolio risk level has exceeded the threshold. Consider rebalancing your portfolio to reduce exposure to high-risk assets.`;
      case 'VOLATILITY':
        return `Portfolio volatility has increased significantly. Consider adding more stable assets to your portfolio.`;
      case 'PORTFOLIO_VALUE':
        return `Your portfolio value has dropped below the alert threshold. Review your positions and consider adjusting your strategy.`;
      default:
        return `Review your portfolio settings and consider consulting with a financial advisor.`;
    }
  }

  async createAlert(userId, data) {
    return prisma.alert.create({
      data: {
        userId,
        type: data.type,
        threshold: data.threshold,
        message: data.message,
        active: true,
      },
    });
  }

  async updateAlert(alertId, data) {
    return prisma.alert.update({
      where: { id: alertId },
      data: {
        threshold: data.threshold,
        message: data.message,
        active: data.active,
      },
    });
  }

  async deleteAlert(alertId) {
    return prisma.alert.delete({
      where: { id: alertId },
    });
  }

  async getAlerts(userId) {
    return prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

module.exports = new AlertService();