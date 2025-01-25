import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const wsConnectRate = new Rate('ws_connect_rate');
const wsMessageRate = new Rate('ws_message_rate');

// Test configuration
const TARGET_URL = __ENV.TEST_TARGET || 'http://localhost:3000';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3000';
const DURATION = __ENV.TEST_DURATION || '5m';
const VUS = parseInt(__ENV.TEST_VUS) || 50;

export const options = {
  stages: [
    { duration: '1m', target: VUS },         // Ramp up
    { duration: DURATION, target: VUS },      // Stay at peak
    { duration: '1m', target: 0 },           // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],        // 95% of requests under 500ms
    ws_connect_rate: ['rate>0.95'],          // 95% WebSocket connection success
    ws_message_rate: ['rate>0.95'],          // 95% WebSocket message success
    errors: ['rate<0.1'],                    // Error rate under 10%
  },
};

export function setup() {
  // Authenticate test user
  const loginRes = http.post(`${TARGET_URL}/api/auth/login`, {
    email: 'testuser@example.com',
    password: 'testpass123',
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  return { token: loginRes.json('token') };
}

export default function(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'Content-Type': 'application/json',
    },
  };

  group('API Endpoints', () => {
    // Portfolio data
    group('Portfolio', () => {
      const portfolioRes = http.get(`${TARGET_URL}/api/portfolio`, params);
      check(portfolioRes, {
        'portfolio status 200': (r) => r.status === 200,
        'portfolio response time OK': (r) => r.timings.duration < 300,
      }) || errorRate.add(1);
    });

    // AI Predictions
    group('AI Predictions', () => {
      const predictionRes = http.get(
        `${TARGET_URL}/api/ai/prediction/BTC`,
        params
      );
      check(predictionRes, {
        'prediction status 200': (r) => r.status === 200,
        'prediction response time OK': (r) => r.timings.duration < 500,
      }) || errorRate.add(1);
    });

    // Blockchain Operations
    group('Blockchain', () => {
      const analyticsRes = http.get(
        `${TARGET_URL}/api/blockchain/analytics`,
        params
      );
      check(analyticsRes, {
        'analytics status 200': (r) => r.status === 200,
        'analytics response time OK': (r) => r.timings.duration < 400,
      }) || errorRate.add(1);
    });
  });

  // WebSocket Testing
  group('WebSocket', () => {
    const wsUrl = `${WS_URL}/ws?token=${data.token}`;
    const wsRes = ws.connect(wsUrl, {}, function(socket) {
      wsConnectRate.add(1);

      socket.on('open', () => {
        // Subscribe to market data
        socket.send(JSON.stringify({
          type: 'subscribe_blockchain',
          userId: 'test-user',
        }));

        // Subscribe to AI updates
        socket.send(JSON.stringify({
          type: 'subscribe_ai',
          userId: 'test-user',
        }));
      });

      socket.on('message', (data) => {
        const message = JSON.parse(data);
        wsMessageRate.add(1);
        
        check(message, {
          'message has type': (m) => m.type !== undefined,
          'message has data': (m) => m.data !== undefined,
        });
      });

      socket.on('error', () => {
        errorRate.add(1);
      });

      // Keep connection alive for a few seconds
      sleep(3);
    });

    check(wsRes, {
      'ws connected successfully': (r) => r && r.status === 101,
    });
  });

  // Random sleep between iterations (100ms-1s)
  sleep(Math.random() * 0.9 + 0.1);
}

export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    metrics: {
      http: {
        totalRequests: data.metrics.http_reqs.values.count,
        failedRequests: data.metrics.http_req_failed.values.count,
        avgResponseTime: data.metrics.http_req_duration.values.avg,
        p95ResponseTime: data.metrics.http_req_duration.values.p95,
      },
      websocket: {
        connectRate: data.metrics.ws_connect_rate.values.rate,
        messageRate: data.metrics.ws_message_rate.values.rate,
      },
      errors: {
        rate: data.metrics.errors.values.rate,
        count: data.metrics.errors.values.count,
      },
      system: {
        maxVUs: VUS,
        testDuration: DURATION,
        targetUrl: TARGET_URL,
      },
    },
  };

  return {
    'stdout': JSON.stringify(summary, null, 2),
    'summary.json': JSON.stringify(summary),
  };
}