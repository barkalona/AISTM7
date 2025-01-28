const WebSocket = require('ws');
const EventEmitter = require('events');
const { validateMessage } = require('../utils/validation');
const logger = require('../utils/logger');

class WebSocketManager extends EventEmitter {
    constructor() {
        super();
        this.clients = new Map(); // Map of client ID to WebSocket connection
        this.subscriptions = new Map(); // Map of topics to set of client IDs
        this.heartbeatInterval = 30000; // 30 seconds
        this.reconnectAttempts = new Map(); // Track reconnection attempts
        this.maxReconnectAttempts = 5;
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ server });
        logger.info('WebSocket server initialized');

        this.wss.on('connection', this.handleConnection.bind(this));
        this.startHeartbeat();
    }

    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        this.clients.set(clientId, ws);

        logger.info(`Client connected: ${clientId}`);

        // Set up client handlers
        ws.on('message', (message) => this.handleMessage(clientId, message));
        ws.on('close', () => this.handleDisconnection(clientId));
        ws.on('error', (error) => this.handleError(clientId, error));

        // Send welcome message
        this.sendToClient(clientId, {
            type: 'connection',
            status: 'connected',
            clientId
        });

        // Initialize client state
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });
    }

    handleMessage(clientId, message) {
        try {
            const parsedMessage = JSON.parse(message);
            
            // Validate message structure
            if (!validateMessage(parsedMessage)) {
                throw new Error('Invalid message format');
            }

            switch (parsedMessage.type) {
                case 'subscribe':
                    this.handleSubscribe(clientId, parsedMessage.topics);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(clientId, parsedMessage.topics);
                    break;
                case 'marketData':
                    this.handleMarketDataRequest(clientId, parsedMessage.data);
                    break;
                case 'portfolio':
                    this.handlePortfolioRequest(clientId, parsedMessage.data);
                    break;
                case 'ping':
                    this.sendToClient(clientId, { type: 'pong' });
                    break;
                default:
                    logger.warn(`Unknown message type: ${parsedMessage.type}`);
            }
        } catch (error) {
            logger.error('Error handling message:', error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Invalid message format'
            });
        }
    }

    handleSubscribe(clientId, topics) {
        if (!Array.isArray(topics)) {
            topics = [topics];
        }

        topics.forEach(topic => {
            if (!this.subscriptions.has(topic)) {
                this.subscriptions.set(topic, new Set());
            }
            this.subscriptions.get(topic).add(clientId);
        });

        this.sendToClient(clientId, {
            type: 'subscribed',
            topics
        });

        logger.info(`Client ${clientId} subscribed to topics: ${topics.join(', ')}`);
    }

    handleUnsubscribe(clientId, topics) {
        if (!Array.isArray(topics)) {
            topics = [topics];
        }

        topics.forEach(topic => {
            const subscribers = this.subscriptions.get(topic);
            if (subscribers) {
                subscribers.delete(clientId);
                if (subscribers.size === 0) {
                    this.subscriptions.delete(topic);
                }
            }
        });

        this.sendToClient(clientId, {
            type: 'unsubscribed',
            topics
        });

        logger.info(`Client ${clientId} unsubscribed from topics: ${topics.join(', ')}`);
    }

    handleDisconnection(clientId) {
        // Clean up subscriptions
        this.subscriptions.forEach((subscribers, topic) => {
            subscribers.delete(clientId);
            if (subscribers.size === 0) {
                this.subscriptions.delete(topic);
            }
        });

        // Remove client
        this.clients.delete(clientId);
        logger.info(`Client disconnected: ${clientId}`);
    }

    handleError(clientId, error) {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        
        // Attempt reconnection
        const attempts = this.reconnectAttempts.get(clientId) || 0;
        if (attempts < this.maxReconnectAttempts) {
            this.reconnectAttempts.set(clientId, attempts + 1);
            setTimeout(() => {
                this.attemptReconnect(clientId);
            }, Math.min(1000 * Math.pow(2, attempts), 30000)); // Exponential backoff
        }
    }

    async handleMarketDataRequest(clientId, data) {
        try {
            // Emit event for market data service to handle
            this.emit('marketDataRequest', {
                clientId,
                ...data
            });
        } catch (error) {
            logger.error('Error handling market data request:', error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Failed to process market data request'
            });
        }
    }

    async handlePortfolioRequest(clientId, data) {
        try {
            // Emit event for portfolio service to handle
            this.emit('portfolioRequest', {
                clientId,
                ...data
            });
        } catch (error) {
            logger.error('Error handling portfolio request:', error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Failed to process portfolio request'
            });
        }
    }

    broadcast(topic, data) {
        const subscribers = this.subscriptions.get(topic);
        if (subscribers) {
            const message = JSON.stringify({
                type: 'update',
                topic,
                data,
                timestamp: new Date().toISOString()
            });

            subscribers.forEach(clientId => {
                const client = this.clients.get(clientId);
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }

    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                ...data,
                timestamp: new Date().toISOString()
            }));
        }
    }

    startHeartbeat() {
        setInterval(() => {
            this.clients.forEach((ws, clientId) => {
                if (ws.isAlive === false) {
                    logger.warn(`Client ${clientId} failed heartbeat check`);
                    return ws.terminate();
                }
                
                ws.isAlive = false;
                ws.ping();
            });
        }, this.heartbeatInterval);
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getConnectedClients() {
        return this.clients.size;
    }

    getSubscriptionCount(topic) {
        return this.subscriptions.get(topic)?.size || 0;
    }

    shutdown() {
        if (this.wss) {
            this.wss.close(() => {
                logger.info('WebSocket server shut down');
            });
        }
    }
}

// Export singleton instance
const websocketManager = new WebSocketManager();
module.exports = websocketManager;