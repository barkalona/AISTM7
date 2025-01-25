const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // userId -> WebSocket
    this.messageQueue = new Map(); // userId -> Queue
    this.reconnectAttempts = new Map(); // userId -> attempts
    this.MAX_RECONNECT_ATTEMPTS = 5;
    this.RECONNECT_INTERVAL = 1000; // Start with 1 second
  }

  addConnection(userId, ws) {
    this.connections.set(userId, ws);
    this.messageQueue.set(userId, []);
    this.reconnectAttempts.set(userId, 0);
    
    ws.on('close', () => this.handleDisconnect(userId));
    ws.on('error', (error) => this.handleError(userId, error));
    
    // Clear any queued messages
    this.flushMessageQueue(userId);
  }

  removeConnection(userId) {
    const ws = this.connections.get(userId);
    if (ws) {
      ws.close();
      this.connections.delete(userId);
      this.messageQueue.delete(userId);
      this.reconnectAttempts.delete(userId);
    }
  }

  sendMessage(userId, message) {
    const ws = this.connections.get(userId);
    const queue = this.messageQueue.get(userId) || [];

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      // Queue message if connection is not ready
      queue.push(message);
      this.messageQueue.set(userId, queue);
      return;
    }

    try {
      ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
      queue.push(message);
      this.messageQueue.set(userId, queue);
    }
  }

  broadcastMessage(message, filter = () => true) {
    for (const [userId, ws] of this.connections) {
      if (filter(userId) && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(userId, message);
      }
    }
  }

  flushMessageQueue(userId) {
    const ws = this.connections.get(userId);
    const queue = this.messageQueue.get(userId) || [];

    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    while (queue.length > 0) {
      const message = queue.shift();
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error flushing message queue:', error);
        queue.unshift(message); // Put message back at front of queue
        break;
      }
    }

    this.messageQueue.set(userId, queue);
  }

  handleDisconnect(userId) {
    const attempts = this.reconnectAttempts.get(userId) || 0;
    
    if (attempts < this.MAX_RECONNECT_ATTEMPTS) {
      const backoffTime = Math.min(1000 * Math.pow(2, attempts), 30000);
      
      setTimeout(() => {
        this.emit('reconnect', userId);
        this.reconnectAttempts.set(userId, attempts + 1);
      }, backoffTime);
    } else {
      this.emit('max_reconnect_attempts', userId);
      this.removeConnection(userId);
    }
  }

  handleError(userId, error) {
    console.error(`WebSocket error for user ${userId}:`, error);
    this.emit('error', { userId, error });
  }

  getConnectionState(userId) {
    const ws = this.connections.get(userId);
    if (!ws) return 'disconnected';
    
    switch (ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }
}

module.exports = new WebSocketManager();