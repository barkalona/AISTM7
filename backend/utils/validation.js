const { PublicKey } = require('@solana/web3.js');
const { isValidIBKRCredentials } = require('../services/ibkrService');

/**
 * Validates a Solana wallet address
 * @param {string} address - The wallet address to validate
 * @returns {boolean} True if the address is valid
 */
const validateWalletAddress = (address) => {
  try {
    if (!address) return false;
    const pubKey = new PublicKey(address);
    return PublicKey.isOnCurve(pubKey);
  } catch (error) {
    console.error('Wallet validation error:', error);
    return false;
  }
};

/**
 * Validates IBKR credentials format
 * @param {Object} credentials - The IBKR credentials
 * @param {string} credentials.username - IBKR username
 * @param {string} credentials.password - IBKR password
 * @returns {Object} Validation result with success and error message
 */
const validateIBKRCredentials = async (credentials) => {
  try {
    if (!credentials.username || !credentials.password) {
      return {
        success: false,
        error: 'Username and password are required'
      };
    }

    // Check username format
    if (!/^[a-zA-Z0-9_]{4,}$/.test(credentials.username)) {
      return {
        success: false,
        error: 'Invalid username format'
      };
    }

    // Check password complexity
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(credentials.password)) {
      return {
        success: false,
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      };
    }

    // Verify credentials with IBKR service
    const isValid = await isValidIBKRCredentials(credentials);
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid IBKR credentials'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('IBKR credentials validation error:', error);
    return {
      success: false,
      error: 'Credentials validation failed'
    };
  }
};

/**
 * Validates automation parameters
 * @param {Object} params - Automation parameters
 * @returns {Object} Validation result with success and error message
 */
const validateAutomationParams = (params) => {
  try {
    const requiredParams = [
      'userId',
      'walletAddress',
      'ibkrCredentials'
    ];

    // Check for required parameters
    for (const param of requiredParams) {
      if (!params[param]) {
        return {
          success: false,
          error: `Missing required parameter: ${param}`
        };
      }
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('Automation parameters validation error:', error);
    return {
      success: false,
      error: 'Parameters validation failed'
    };
  }
};

/**
 * Validates token balance meets minimum requirements
 * @param {string} walletAddress - The wallet address to check
 * @param {number} requiredBalance - Required token balance
 * @returns {Promise<Object>} Validation result with success and error message
 */
const validateTokenBalance = async (walletAddress, requiredBalance) => {
  try {
    const balance = await getTokenBalance(walletAddress);
    if (balance < requiredBalance) {
      return {
        success: false,
        error: `Insufficient token balance. Required: ${requiredBalance}, Current: ${balance}`
      };
    }

    return {
      success: true,
      balance
    };
  } catch (error) {
    console.error('Token balance validation error:', error);
    return {
      success: false,
      error: 'Failed to validate token balance'
    };
  }
};

/**
 * Validates user permissions for automation
 * @param {string} userId - The user ID to validate
 * @returns {Promise<Object>} Validation result with success and error message
 */
const validateUserPermissions = async (userId) => {
  try {
    // Check if user exists and has required permissions
    const user = await getUserById(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Check if user has completed required setup
    if (!user.emailVerified) {
      return {
        success: false,
        error: 'Email verification required'
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('User permissions validation error:', error);
    return {
      success: false,
      error: 'Failed to validate user permissions'
    };
  }
};

module.exports = {
  validateWalletAddress,
  validateIBKRCredentials,
  validateAutomationParams,
  validateTokenBalance,
  validateUserPermissions
};