// Set up environment variables for testing
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:3001';
process.env.NEXT_PUBLIC_SOLANA_RPC_URL = 'http://localhost:8899';
process.env.NEXT_PUBLIC_SOLANA_NETWORK = 'devnet';
process.env.NEXT_PUBLIC_AISTM7_TOKEN_ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
process.env.NEXT_PUBLIC_MINIMUM_TOKEN_BALANCE = '700000';

// Auth configuration
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-dont-use-in-prod';

// Database configuration
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/aistm7_test';

// IBKR API configuration
process.env.IBKR_CLIENT_PORTAL_URL = 'http://localhost:5000';
process.env.IBKR_PAPER_TRADING = 'true';

// Email configuration
process.env.EMAIL_SERVER_HOST = 'localhost';
process.env.EMAIL_SERVER_PORT = '1025';
process.env.EMAIL_SERVER_USER = 'test';
process.env.EMAIL_SERVER_PASSWORD = 'test';
process.env.EMAIL_FROM = 'noreply@aistm7.local';

// Redis configuration
process.env.REDIS_URL = 'redis://localhost:6379';

// Monitoring configuration
process.env.METRICS_PORT = '3001';
process.env.LOG_LEVEL = 'error';

// Feature flags
process.env.ENABLE_PAPER_TRADING = 'true';
process.env.ENABLE_LIVE_TRADING = 'false';
process.env.ENABLE_NOTIFICATIONS = 'true';
process.env.ENABLE_EMAIL_ALERTS = 'true';
process.env.ENABLE_SMS_ALERTS = 'false';

// Risk management settings
process.env.MAX_POSITION_SIZE = '100000';
process.env.MAX_DRAWDOWN_PERCENTAGE = '10';
process.env.STOP_LOSS_PERCENTAGE = '2';
process.env.TAKE_PROFIT_PERCENTAGE = '5';

// Performance monitoring
process.env.ENABLE_PERFORMANCE_MONITORING = 'true';
process.env.METRICS_RETENTION_DAYS = '7';

// AI model settings
process.env.AI_MODEL_ENDPOINT = 'http://localhost:5001';
process.env.AI_MODEL_VERSION = 'v1.0.0';
process.env.ENABLE_MODEL_CACHING = 'true';
process.env.MODEL_CACHE_TTL = '3600';

// Security settings
process.env.JWT_SECRET = 'test-jwt-secret-dont-use-in-prod';
process.env.JWT_EXPIRY = '1h';
process.env.ENABLE_2FA = 'true';
process.env.RATE_LIMIT_REQUESTS = '100';
process.env.RATE_LIMIT_WINDOW = '900';

// Blockchain settings
process.env.BLOCKCHAIN_NETWORK = 'testnet';
process.env.BLOCKCHAIN_CONFIRMATIONS = '1';
process.env.GAS_PRICE_MULTIPLIER = '1.1';

// Test specific settings
process.env.TEST_MODE = 'true';
process.env.MOCK_EXTERNAL_APIS = 'true';
process.env.SKIP_AUTHENTICATION = 'true';
process.env.USE_TEST_DATABASE = 'true';

// Cache settings
process.env.CACHE_DRIVER = 'memory';
process.env.CACHE_PREFIX = 'test';
process.env.CACHE_TTL = '300';

// Websocket settings
process.env.WS_HEARTBEAT_INTERVAL = '30000';
process.env.WS_RECONNECT_ATTEMPTS = '3';
process.env.WS_RECONNECT_INTERVAL = '1000';

// API settings
process.env.API_TIMEOUT = '5000';
process.env.API_RETRY_ATTEMPTS = '3';
process.env.API_RETRY_DELAY = '1000';

// Logging settings
process.env.LOG_FORMAT = 'json';
process.env.LOG_TO_FILE = 'false';
process.env.LOG_FILE_PATH = './logs/test.log';

// Session settings
process.env.SESSION_SECRET = 'test-session-secret-dont-use-in-prod';
process.env.SESSION_TTL = '86400';

// Export a function that can be used to reset environment variables to their default test values
export const resetTestEnv = () => {
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('NEXT_PUBLIC_') || 
        key.startsWith('TEST_') || 
        key === 'NODE_ENV') {
      return;
    }
    delete process.env[key];
  });
  
  // Re-run this file to reset all values
  require('./setEnvVars');
};