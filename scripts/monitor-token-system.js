const { Connection, PublicKey } = require('@solana/web3.js');
const { Program } = require('@project-serum/anchor');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class TokenSystemMonitor {
    constructor() {
        this.connection = new Connection(process.env.SOLANA_RPC_URL, 'confirmed');
        this.deploymentInfo = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../blockchain/deployment.json'))
        );
        
        // Initialize services
        this.tokenPriceService = require('../backend/services/tokenPriceService');
        this.balanceRequirementService = require('../backend/services/balanceRequirementService');
        
        // Monitoring intervals
        this.priceMonitorInterval = null;
        this.requirementCheckInterval = null;
        this.healthCheckInterval = null;
        
        // Thresholds
        this.PRICE_CHANGE_THRESHOLD = 0.01; // 1%
        this.HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
        this.ALERT_THRESHOLD = 0.05; // 5% change
    }

    async start() {
        try {
            console.log('Starting token system monitoring...');

            // Start price monitoring
            await this.tokenPriceService.startPriceMonitoring();
            console.log('Price monitoring started');

            // Start requirement checks
            this.startRequirementMonitoring();
            console.log('Requirement monitoring started');

            // Start health checks
            this.startHealthChecks();
            console.log('Health checks started');

            // Initial system status
            await this.printSystemStatus();
        } catch (error) {
            console.error('Error starting monitoring:', error);
            throw error;
        }
    }

    async stop() {
        console.log('Stopping token system monitoring...');
        
        this.tokenPriceService.stopPriceMonitoring();
        clearInterval(this.requirementCheckInterval);
        clearInterval(this.healthCheckInterval);
        
        console.log('Monitoring stopped');
    }

    startRequirementMonitoring() {
        this.requirementCheckInterval = setInterval(async () => {
            try {
                const metrics = await this.getSystemMetrics();
                await this.checkAndUpdateRequirement(metrics);
            } catch (error) {
                console.error('Error in requirement monitoring:', error);
            }
        }, 60000); // Check every minute
    }

    startHealthChecks() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                await this.performHealthCheck();
            } catch (error) {
                console.error('Health check failed:', error);
                this.sendAlert('System health check failed', error);
            }
        }, this.HEALTH_CHECK_INTERVAL);
    }

    async checkAndUpdateRequirement(metrics) {
        try {
            const { currentPrice, targetUsdValue, currentRequirement } = metrics;
            const currentUsdValue = currentPrice * currentRequirement;
            
            // Calculate percentage difference from target
            const difference = Math.abs(currentUsdValue - targetUsdValue) / targetUsdValue;
            
            if (difference > this.PRICE_CHANGE_THRESHOLD) {
                console.log(`Significant price change detected (${(difference * 100).toFixed(2)}%)`);
                await this.balanceRequirementService.updateRequirement();
                
                // Send alert if change is above alert threshold
                if (difference > this.ALERT_THRESHOLD) {
                    this.sendAlert('Significant requirement change', {
                        difference: (difference * 100).toFixed(2) + '%',
                        oldRequirement: currentRequirement,
                        newRequirement: (await this.balanceRequirementService.getCurrentRequirement()).requiredAmount
                    });
                }
            }
        } catch (error) {
            console.error('Error checking/updating requirement:', error);
            this.sendAlert('Requirement update failed', error);
        }
    }

    async getSystemMetrics() {
        const [priceMetrics, requirement] = await Promise.all([
            this.tokenPriceService.getTokenMetrics(),
            this.balanceRequirementService.getCurrentRequirement()
        ]);

        return {
            currentPrice: priceMetrics.currentPrice,
            priceChange24h: priceMetrics.priceChange24h,
            targetUsdValue: requirement.targetUsdValue,
            currentRequirement: requirement.requiredAmount,
            lastUpdate: requirement.lastUpdate
        };
    }

    async performHealthCheck() {
        const checks = {
            priceService: false,
            requirementService: false,
            blockchain: false
        };

        try {
            // Check price service
            const price = await this.tokenPriceService.getCurrentPrice();
            checks.priceService = price > 0;

            // Check requirement service
            const requirement = await this.balanceRequirementService.getCurrentRequirement();
            checks.requirementService = requirement.requiredAmount > 0;

            // Check blockchain connection
            const blockHeight = await this.connection.getBlockHeight();
            checks.blockchain = blockHeight > 0;

            // Log health status
            console.log('Health check completed:', checks);

            // Alert if any check failed
            const failedChecks = Object.entries(checks)
                .filter(([, status]) => !status)
                .map(([name]) => name);

            if (failedChecks.length > 0) {
                this.sendAlert('Health check failed', { failedChecks });
            }

            return checks;
        } catch (error) {
            console.error('Health check error:', error);
            this.sendAlert('Health check error', error);
            return checks;
        }
    }

    async printSystemStatus() {
        try {
            const metrics = await this.getSystemMetrics();
            console.log('\nSystem Status:');
            console.log('-------------');
            console.log(`Current Price: $${metrics.currentPrice.toFixed(6)}`);
            console.log(`24h Price Change: ${metrics.priceChange24h.toFixed(2)}%`);
            console.log(`Current Requirement: ${metrics.currentRequirement} tokens`);
            console.log(`Target USD Value: $${metrics.targetUsdValue}`);
            console.log(`Last Update: ${metrics.lastUpdate}`);
            console.log('-------------\n');
        } catch (error) {
            console.error('Error printing system status:', error);
        }
    }

    sendAlert(title, data) {
        // TODO: Implement alert system (email, Slack, etc.)
        console.warn('ALERT:', title, data);
    }

    async getRequirementHistory(days = 7) {
        try {
            const history = await this.balanceRequirementService.getRequirementHistory(days);
            return history.map(entry => ({
                timestamp: entry.timestamp,
                requirement: entry.requirement,
                price: entry.price,
                usdValue: entry.requirement * entry.price
            }));
        } catch (error) {
            console.error('Error getting requirement history:', error);
            throw error;
        }
    }
}

// Execute if run directly
if (require.main === module) {
    const monitor = new TokenSystemMonitor();
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        await monitor.stop();
        process.exit(0);
    });

    monitor.start().catch(error => {
        console.error('Monitor failed to start:', error);
        process.exit(1);
    });
}

module.exports = TokenSystemMonitor;