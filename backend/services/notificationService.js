const nodemailer = require('nodemailer');
const { formatRiskLevel, formatCurrency } = require('../utils/formatting');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST,
      port: process.env.EMAIL_SERVER_PORT,
      secure: process.env.EMAIL_SERVER_PORT === '465',
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });
  }

  async sendEmail(to, subject, html) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
      });
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendRiskAlert(user, portfolio, riskMetrics) {
    const subject = `AISTM7 Risk Alert: Portfolio Risk Level ${riskMetrics.riskLevel}`;
    const html = `
      <h2>Risk Alert for Your Portfolio</h2>
      <p>Dear ${user.name},</p>
      <p>Our AI system has detected important changes in your portfolio risk metrics:</p>
      <ul>
        <li>Current Risk Level: ${formatRiskLevel(riskMetrics.riskLevel)}</li>
        <li>Value at Risk (VaR): ${formatCurrency(riskMetrics.valueAtRisk)}</li>
        <li>Sharpe Ratio: ${riskMetrics.sharpeRatio.toFixed(2)}</li>
      </ul>
      <h3>Recommendations:</h3>
      <p>${riskMetrics.recommendations}</p>
      <p>Log in to your AISTM7 dashboard for detailed analysis and actionable insights.</p>
      <p>Best regards,<br>AISTM7 Team</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  async sendPortfolioSummary(user, portfolio, analysis) {
    const subject = 'AISTM7 Daily Portfolio Summary';
    const html = `
      <h2>Daily Portfolio Summary</h2>
      <p>Dear ${user.name},</p>
      <p>Here's your daily portfolio performance summary:</p>
      <ul>
        <li>Total Value: ${formatCurrency(portfolio.totalValue)}</li>
        <li>Daily Change: ${portfolio.dailyChange}%</li>
        <li>Risk-Adjusted Return: ${analysis.riskAdjustedReturn.toFixed(2)}%</li>
      </ul>
      <h3>Key Insights:</h3>
      <p>${analysis.insights}</p>
      <h3>AI Recommendations:</h3>
      <p>${analysis.recommendations}</p>
      <p>Visit your dashboard for more detailed analytics and personalized recommendations.</p>
      <p>Best regards,<br>AISTM7 Team</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  async sendVerificationEmail(user, verificationToken) {
    const subject = 'Verify Your AISTM7 Account';
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`;
    const html = `
      <h2>Welcome to AISTM7!</h2>
      <p>Dear ${user.name},</p>
      <p>Thank you for registering with AISTM7. Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationUrl}">Verify Email Address</a></p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <p>Best regards,<br>AISTM7 Team</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }

  async sendPasswordReset(user, resetToken) {
    const subject = 'Reset Your AISTM7 Password';
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;
    const html = `
      <h2>Password Reset Request</h2>
      <p>Dear ${user.name},</p>
      <p>We received a request to reset your AISTM7 password. Click the link below to set a new password:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>If you didn't request this change, you can safely ignore this email.</p>
      <p>Best regards,<br>AISTM7 Team</p>
    `;
    return this.sendEmail(user.email, subject, html);
  }
}

module.exports = new NotificationService();