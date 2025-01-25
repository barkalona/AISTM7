const { Connection, PublicKey } = require('@solana/web3.js');
const { getPythProgramKeyForCluster, parsePriceData } = require('@pythnetwork/client');
const BalanceRequirementService = require('./balanceRequirementService');

class TokenPriceService {
    constructor() {
        if (!process.env.SOLANA_RPC_URL || !process.env.AISTM7_TOKEN_ADDRESS || !process.env.PYTH_PRICE_FEED) {
            throw new Error('Required environment variables not set');
        }

        this.connection = new Connection(process.env.SOLANA_RPC_URL);
        this.tokenAddress = new PublicKey(process.env.AISTM7_TOKEN_ADDRESS);
        this.priceFeedAddress = new PublicKey(process.env.PYTH_PRICE_FEED);
        this.pythProgramId = getPythProgramKeyForCluster('mainnet-beta');
        
        this.balanceRequirementService = new BalanceRequirementService(
            this.connection,
            this.tokenAddress,
            this.priceFeedAddress
        );

        this.updateInterval = null;
        this.priceHistory = [];
        this.MAX_HISTORY_LENGTH = 1000; // Keep last 1000 price points
    }

    async startPriceMonitoring(intervalMs = 60000) { // Default 1 minute
        if (this.updateInterval) {
            console.warn('Price monitoring already started');
            return;
        }

        // Initial update
        await this.updatePrice();

        this.updateInterval = setInterval(async () => {
            try {
                await this.updatePrice();
            } catch (error) {
                console.error('Error updating price:', error);
            }
        }, intervalMs);

        console.log('Price monitoring started');
    }

    stopPriceMonitoring() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('Price monitoring stopped');
        }
    }

    async updatePrice() {
        try {
            // Get current price from Pyth
            const priceAccount = await this.connection.getAccountInfo(this.priceFeedAddress);
            if (!priceAccount) {
                throw new Error('Price feed account not found');
            }

            const price = this.parsePythPrice(priceAccount.data);
            const timestamp = new Date();

            // Add to price history
            this.priceHistory.push({ price, timestamp });
            if (this.priceHistory.length > this.MAX_HISTORY_LENGTH) {
                this.priceHistory.shift(); // Remove oldest entry
            }

            // Check if requirement update is needed
            await this.checkAndUpdateRequirement(price);

            return { price, timestamp };
        } catch (error) {
            console.error('Error in updatePrice:', error);
            throw error;
        }
    }

    async checkAndUpdateRequirement(currentPrice) {
        try {
            const { requiredAmount, targetUsdValue } = await this.balanceRequirementService.getCurrentRequirement();
            
            // Calculate the current USD value of the requirement
            const currentUsdValue = currentPrice * requiredAmount;
            
            // Update if the value differs by more than 1% from target
            const difference = Math.abs(currentUsdValue - targetUsdValue) / targetUsdValue;
            if (difference > 0.01) { // 1% threshold
                await this.balanceRequirementService.updateRequirement();
                console.log('Balance requirement updated due to price change');
            }
        } catch (error) {
            console.error('Error checking/updating requirement:', error);
            throw error;
        }
    }

    parsePythPrice(data) {
        try {
            const priceData = parsePriceData(data);
            // Get the aggregate price (in USD with 6 decimal places)
            const price = priceData.aggregate.price;
            // Convert price to standard decimal
            return price / 1_000_000;
        } catch (error) {
            console.error('Error parsing Pyth price:', error);
            throw new Error('Failed to parse price data');
        }
    }

    async getPriceHistory(timeframe = '24h') {
        const now = new Date();
        let cutoff;

        switch (timeframe) {
            case '1h':
                cutoff = new Date(now - 60 * 60 * 1000);
                break;
            case '24h':
                cutoff = new Date(now - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
                break;
            default:
                throw new Error('Invalid timeframe');
        }

        return this.priceHistory.filter(entry => entry.timestamp >= cutoff);
    }

    async getTokenMetrics() {
        try {
            const currentPrice = await this.getCurrentPrice();
            const priceHistory24h = await this.getPriceHistory('24h');
            
            if (priceHistory24h.length < 2) {
                throw new Error('Insufficient price history');
            }

            // Calculate 24h metrics
            const oldestPrice = priceHistory24h[0].price;
            const priceChange24h = ((currentPrice - oldestPrice) / oldestPrice) * 100;
            
            // Calculate high/low
            const prices24h = priceHistory24h.map(entry => entry.price);
            const high24h = Math.max(...prices24h);
            const low24h = Math.min(...prices24h);

            // Get current requirement
            const requirement = await this.balanceRequirementService.getCurrentRequirement();

            return {
                currentPrice,
                priceChange24h,
                high24h,
                low24h,
                currentRequirement: requirement.requiredAmount,
                targetUsdValue: requirement.targetUsdValue,
                lastUpdate: requirement.lastUpdate
            };
        } catch (error) {
            console.error('Error getting token metrics:', error);
            throw error;
        }
    }

    async getCurrentPrice() {
        if (this.priceHistory.length === 0) {
            await this.updatePrice();
        }
        return this.priceHistory[this.priceHistory.length - 1].price;
    }
}

module.exports = new TokenPriceService();