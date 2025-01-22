import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Get test configuration from environment variables
const TARGET_URL = __ENV.TEST_TARGET || 'http://localhost:3000';
const DURATION = __ENV.TEST_DURATION || '5m';
const VUS = parseInt(__ENV.TEST_VUS) || 50;
const RAMP_UP = __ENV.TEST_RAMP_UP || '1m';
const RAMP_DOWN = __ENV.TEST_RAMP_DOWN || '1m';

// Test stages for ramping up/down VUs
const stages = [
    { duration: RAMP_UP, target: VUS },      // Ramp up
    { duration: DURATION, target: VUS },      // Stay at target
    { duration: RAMP_DOWN, target: 0 },       // Ramp down
];

// Test configuration
export const options = {
    stages,
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
        errors: ['rate<0.1'],             // Error rate should be below 10%
    },
};

// Setup function (runs once per VU)
export function setup() {
    // Perform any setup needed (e.g., authentication)
    const loginRes = http.post(`${TARGET_URL}/api/auth/login`, {
        username: 'testuser',
        password: 'testpass',
    });

    check(loginRes, {
        'logged in successfully': (resp) => resp.status === 200,
    });

    return { token: loginRes.json('token') };
}

// Default function (called for each VU iteration)
export default function(data) {
    const params = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    // Main test scenario
    group('API Endpoints', () => {
        // GET request example
        {
            const res = http.get(`${TARGET_URL}/api/data`, params);
            check(res, {
                'status is 200': (r) => r.status === 200,
                'response time OK': (r) => r.timings.duration < 200,
            }) || errorRate.add(1);
        }

        // POST request example
        {
            const payload = JSON.stringify({
                data: 'test',
                timestamp: new Date().toISOString(),
            });

            const res = http.post(`${TARGET_URL}/api/data`, payload, params);
            check(res, {
                'status is 201': (r) => r.status === 201,
                'response time OK': (r) => r.timings.duration < 300,
            }) || errorRate.add(1);
        }

        // Random sleep between requests (100ms-1s)
        sleep(Math.random() * 0.9 + 0.1);
    });
}

// Teardown function (runs once per VU after test completion)
export function teardown(data) {
    // Perform any cleanup needed
    http.post(`${TARGET_URL}/api/auth/logout`, null, {
        headers: { 'Authorization': `Bearer ${data.token}` },
    });
}

// Handle test completion
export function handleSummary(data) {
    // Format test results for our monitoring UI
    const summary = {
        timestamp: new Date().toISOString(),
        summary: {
            totalRequests: data.metrics.http_reqs.values.count,
            failedRequests: data.metrics.http_req_failed.values.count,
            avgResponseTime: data.metrics.http_req_duration.values.avg,
            p95ResponseTime: data.metrics.http_req_duration.values.p95,
            requestsPerSecond: data.metrics.http_reqs.values.rate,
        },
        systemMetrics: {
            maxCpuUsage: data.metrics.system_cpu_utilization?.values.max || 0,
            avgCpuUsage: data.metrics.system_cpu_utilization?.values.avg || 0,
            maxMemoryUsage: data.metrics.system_memory_utilization?.values.max || 0,
            avgMemoryUsage: data.metrics.system_memory_utilization?.values.avg || 0,
        },
    };

    // Write results to stdout for the Node.js wrapper to capture
    console.log(JSON.stringify({ type: 'results', data: summary }));

    return {
        'stdout': JSON.stringify(summary, null, 2),
        'results.json': JSON.stringify(summary),
    };
}

// Helper function to format bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Helper function to format duration
function formatDuration(ms) {
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

// Helper function for percentage calculations
function calculatePercentage(value, total) {
    return ((value / total) * 100).toFixed(2);
}