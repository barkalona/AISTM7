const { handleSummary, formatBytes, formatDuration, calculatePercentage } = require('./run_load_test');

describe('Load Test Script', () => {
    const mockData = {
        metrics: {
            http_reqs: {
                values: {
                    count: 1000,
                    rate: 50.5
                }
            },
            http_req_failed: {
                values: {
                    count: 10
                }
            },
            http_req_duration: {
                values: {
                    avg: 150.25,
                    p95: 450.75
                }
            },
            system_cpu_utilization: {
                values: {
                    max: 85.5,
                    avg: 65.25
                }
            },
            system_memory_utilization: {
                values: {
                    max: 75.8,
                    avg: 60.4
                }
            }
        }
    };

    beforeEach(() => {
        // Mock console.log to capture output
        console.log = jest.fn();
    });

    it('formats test summary correctly', () => {
        const result = handleSummary(mockData);
        const summary = JSON.parse(result['results.json']);

        expect(summary).toHaveProperty('timestamp');
        expect(summary.summary).toEqual({
            totalRequests: 1000,
            failedRequests: 10,
            avgResponseTime: 150.25,
            p95ResponseTime: 450.75,
            requestsPerSecond: 50.5
        });
        expect(summary.systemMetrics).toEqual({
            maxCpuUsage: 85.5,
            avgCpuUsage: 65.25,
            maxMemoryUsage: 75.8,
            avgMemoryUsage: 60.4
        });
    });

    it('handles missing system metrics gracefully', () => {
        const dataWithoutSystemMetrics = {
            metrics: {
                ...mockData.metrics,
                system_cpu_utilization: undefined,
                system_memory_utilization: undefined
            }
        };

        const result = handleSummary(dataWithoutSystemMetrics);
        const summary = JSON.parse(result['results.json']);

        expect(summary.systemMetrics).toEqual({
            maxCpuUsage: 0,
            avgCpuUsage: 0,
            maxMemoryUsage: 0,
            avgMemoryUsage: 0
        });
    });

    it('logs results with correct type', () => {
        handleSummary(mockData);

        expect(console.log).toHaveBeenCalledWith(
            expect.stringContaining('"type":"results"')
        );
    });

    it('formats bytes correctly', () => {
        expect(formatBytes(0)).toBe('0 B');
        expect(formatBytes(1024)).toBe('1 KB');
        expect(formatBytes(1024 * 1024)).toBe('1 MB');
        expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
        expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
        expect(formatBytes(1500)).toBe('1.46 KB');
    });

    it('formats duration correctly', () => {
        expect(formatDuration(500)).toBe('500.00ms');
        expect(formatDuration(1500)).toBe('1.50s');
        expect(formatDuration(60000)).toBe('60.00s');
    });

    it('calculates percentage correctly', () => {
        expect(calculatePercentage(50, 100)).toBe('50.00');
        expect(calculatePercentage(33, 100)).toBe('33.00');
        expect(calculatePercentage(0, 100)).toBe('0.00');
        expect(calculatePercentage(100, 100)).toBe('100.00');
    });

    it('generates both stdout and JSON output', () => {
        const result = handleSummary(mockData);

        expect(result).toHaveProperty('stdout');
        expect(result).toHaveProperty('results.json');
        expect(JSON.parse(result.stdout)).toEqual(JSON.parse(result['results.json']));
    });

    it('includes all required metrics in summary', () => {
        const result = handleSummary(mockData);
        const summary = JSON.parse(result['results.json']);

        // Check summary structure
        expect(summary).toHaveProperty('timestamp');
        expect(summary).toHaveProperty('summary');
        expect(summary).toHaveProperty('systemMetrics');

        // Check summary metrics
        const { summary: metrics } = summary;
        expect(metrics).toHaveProperty('totalRequests');
        expect(metrics).toHaveProperty('failedRequests');
        expect(metrics).toHaveProperty('avgResponseTime');
        expect(metrics).toHaveProperty('p95ResponseTime');
        expect(metrics).toHaveProperty('requestsPerSecond');

        // Check system metrics
        const { systemMetrics } = summary;
        expect(systemMetrics).toHaveProperty('maxCpuUsage');
        expect(systemMetrics).toHaveProperty('avgCpuUsage');
        expect(systemMetrics).toHaveProperty('maxMemoryUsage');
        expect(systemMetrics).toHaveProperty('avgMemoryUsage');
    });

    it('validates metric values are numbers', () => {
        const result = handleSummary(mockData);
        const summary = JSON.parse(result['results.json']);

        const { summary: metrics, systemMetrics } = summary;

        // Check summary metrics are numbers
        expect(typeof metrics.totalRequests).toBe('number');
        expect(typeof metrics.failedRequests).toBe('number');
        expect(typeof metrics.avgResponseTime).toBe('number');
        expect(typeof metrics.p95ResponseTime).toBe('number');
        expect(typeof metrics.requestsPerSecond).toBe('number');

        // Check system metrics are numbers
        expect(typeof systemMetrics.maxCpuUsage).toBe('number');
        expect(typeof systemMetrics.avgCpuUsage).toBe('number');
        expect(typeof systemMetrics.maxMemoryUsage).toBe('number');
        expect(typeof systemMetrics.avgMemoryUsage).toBe('number');
    });
});