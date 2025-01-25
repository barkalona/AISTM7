import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import express, { Request, Response } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { enhancedSolanaService } from './services/enhancedSolanaService';
import { enhancedAIService } from './services/enhancedAIService';

interface WebSocketMessage {
  type: 'subscribe_blockchain' | 'subscribe_ai';
  userId: string;
  data?: any;
}

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  ws.on('message', async (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString()) as WebSocketMessage;
      
      switch (data.type) {
        case 'subscribe_blockchain':
          // Handle blockchain subscriptions
          enhancedSolanaService.addWebSocket(data.userId, ws);
          break;
          
        case 'subscribe_ai':
          // Handle AI updates subscriptions
          // Add to AI service subscribers
          break;
          
        default:
          ws.send(JSON.stringify({ error: 'Unknown message type' }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ error: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Clean up subscriptions
  });
});

// API Routes
// Blockchain routes
app.get('/api/blockchain/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const transactions = await enhancedSolanaService.getTransactionHistory(
      req.params.userId
    );
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/api/blockchain/analytics/:symbol', async (req: Request, res: Response) => {
  try {
    const analytics = await enhancedSolanaService.getTokenAnalytics();
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// AI routes
app.get('/api/ai/prediction/:symbol', async (req: Request, res: Response) => {
  try {
    const prediction = await enhancedAIService.predict_with_uncertainty(
      req.params.symbol,
      req.query.market_data as any
    );
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.post('/api/ai/train/:symbol', async (req: Request, res: Response) => {
  try {
    const modelInfo = await enhancedAIService.train_advanced_prediction_model(
      req.params.symbol,
      req.body.historicalData,
      req.body.marketData
    );
    res.json(modelInfo);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create serverless handler
const serverlessHandler = serverless(app);

// Export the handler for Netlify Functions
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  try {
    // Handle WebSocket upgrade requests
    if (event.headers['Upgrade']?.toLowerCase() === 'websocket') {
      return {
        statusCode: 101,
        body: '',
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Accept': event.headers['Sec-WebSocket-Key'] || ''
        }
      };
    }

    // Handle regular HTTP requests
    const result = await serverlessHandler(event, context);
    
    // Ensure result matches HandlerResponse type
    return {
      statusCode: result.statusCode || 200,
      body: result.body || '',
      headers: {
        'Content-Type': 'application/json',
        ...result.headers
      }
    };
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};