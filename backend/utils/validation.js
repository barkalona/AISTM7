const logger = require('./logger');

/**
 * Validates WebSocket message structure
 * @param {Object} message - The message to validate
 * @returns {boolean} - Whether the message is valid
 */
function validateMessage(message) {
    try {
        // Check if message is an object
        if (!message || typeof message !== 'object') {
            return false;
        }

        // Check required fields
        if (!message.type) {
            return false;
        }

        // Validate specific message types
        switch (message.type) {
            case 'subscribe':
            case 'unsubscribe':
                return validateSubscriptionMessage(message);
            case 'marketData':
                return validateMarketDataMessage(message);
            case 'portfolio':
                return validatePortfolioMessage(message);
            case 'ping':
                return true; // Ping messages only need type
            default:
                logger.warn(`Unknown message type for validation: ${message.type}`);
                return false;
        }
    } catch (error) {
        logger.error('Error validating message:', error);
        return false;
    }
}

/**
 * Validates subscription-related messages
 * @param {Object} message - The subscription message
 * @returns {boolean} - Whether the message is valid
 */
function validateSubscriptionMessage(message) {
    if (!message.topics) {
        return false;
    }

    if (Array.isArray(message.topics)) {
        return message.topics.every(topic => typeof topic === 'string' && topic.length > 0);
    }

    return typeof message.topics === 'string' && message.topics.length > 0;
}

/**
 * Validates market data request messages
 * @param {Object} message - The market data message
 * @returns {boolean} - Whether the message is valid
 */
function validateMarketDataMessage(message) {
    if (!message.data) {
        return false;
    }

    const requiredFields = ['symbol', 'interval'];
    return requiredFields.every(field => {
        const value = message.data[field];
        return value !== undefined && value !== null && value !== '';
    });
}

/**
 * Validates portfolio request messages
 * @param {Object} message - The portfolio message
 * @returns {boolean} - Whether the message is valid
 */
function validatePortfolioMessage(message) {
    if (!message.data) {
        return false;
    }

    const requiredFields = ['userId', 'action'];
    const validActions = ['fetch', 'update', 'sync'];

    return requiredFields.every(field => {
        const value = message.data[field];
        return value !== undefined && value !== null && value !== '';
    }) && validActions.includes(message.data.action);
}

/**
 * Validates market data update format
 * @param {Object} data - The market data update
 * @returns {boolean} - Whether the data is valid
 */
function validateMarketDataUpdate(data) {
    const requiredFields = ['symbol', 'price', 'timestamp'];
    
    return requiredFields.every(field => {
        const value = data[field];
        return value !== undefined && value !== null;
    }) && 
    typeof data.price === 'number' &&
    !isNaN(new Date(data.timestamp).getTime());
}

/**
 * Validates portfolio update format
 * @param {Object} data - The portfolio update
 * @returns {boolean} - Whether the data is valid
 */
function validatePortfolioUpdate(data) {
    const requiredFields = ['userId', 'assets', 'timestamp'];
    
    return requiredFields.every(field => {
        const value = data[field];
        return value !== undefined && value !== null;
    }) && 
    Array.isArray(data.assets) &&
    data.assets.every(asset => validateAsset(asset)) &&
    !isNaN(new Date(data.timestamp).getTime());
}

/**
 * Validates asset data structure
 * @param {Object} asset - The asset data
 * @returns {boolean} - Whether the asset is valid
 */
function validateAsset(asset) {
    const requiredFields = ['symbol', 'quantity', 'value'];
    
    return requiredFields.every(field => {
        const value = asset[field];
        return value !== undefined && value !== null;
    }) &&
    typeof asset.quantity === 'number' &&
    typeof asset.value === 'number';
}

module.exports = {
    validateMessage,
    validateMarketDataUpdate,
    validatePortfolioUpdate,
    validateAsset
};