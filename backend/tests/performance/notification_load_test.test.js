const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const LoadTestRunner = require('./notification_load_test');

// Mock child_process.spawn
jest.mock('child_process', () => ({
    spawn: jest.fn(),
}));

describe('LoadTestRunner', () => {
    let mockProcess;
    let mockStdout;
    let mockStderr;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Create mock process streams
        mockStdout = new EventEmitter();
        mockStderr = new EventEmitter();
        mockProcess = new EventEmitter();
        mockProcess.stdout = mockStdout;
        mockProcess.stderr = mockStderr;
        mockProcess.kill = jest.fn();

        // Mock spawn to return our mock process
        spawn.mockReturnValue(mockProcess);
    });

    it('starts a load test with correct configuration', async () => {
        const config = {
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
            rampUp: '5s',
            rampDown: '5s',
        };

        const testPromise = LoadTestRunner.startTest(config);

        // Verify spawn was called with correct arguments
        expect(spawn).toHaveBeenCalledWith(
            'k6',
            ['run', expect.stringContaining('run_load_test.js')],
            expect.objectContaining({
                env: expect.objectContaining({
                    TEST_TARGET: config.targetUrl,
                    TEST_DURATION: config.duration,
                    TEST_VUS: '10',
                    TEST_RAMP_UP: config.rampUp,
                    TEST_RAMP_DOWN: config.rampDown,
                }),
            })
        );

        // Simulate successful test completion
        mockProcess.emit('close', 0);
        await testPromise;
    });

    it('emits and stores test results', async () => {
        const testResults = {
            type: 'results',
            data: {
                summary: {
                    totalRequests: 1000,
                    failedRequests: 10,
                },
            },
        };

        const resultPromise = LoadTestRunner.startTest({
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
        });

        // Mock receiving test results
        mockStdout.emit('data', JSON.stringify(testResults));

        // Verify results were stored and emitted
        expect(LoadTestRunner.results).toEqual(testResults.data);

        mockProcess.emit('close', 0);
        await resultPromise;
    });

    it('handles test errors', async () => {
        const errorMessage = 'Test execution failed';

        const testPromise = LoadTestRunner.startTest({
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
        });

        // Simulate error
        mockStderr.emit('data', errorMessage);
        mockProcess.emit('close', 1);

        await expect(testPromise).rejects.toThrow();
        expect(LoadTestRunner.error).toBe(errorMessage);
    });

    it('prevents starting multiple tests simultaneously', async () => {
        const config = {
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
        };

        // Start first test
        const firstTest = LoadTestRunner.startTest(config);

        // Attempt to start second test
        await expect(LoadTestRunner.startTest(config)).rejects.toThrow(
            'Test already running'
        );

        mockProcess.emit('close', 0);
        await firstTest;
    });

    it('stops running test gracefully', async () => {
        const testPromise = LoadTestRunner.startTest({
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
        });

        // Stop test
        const stopPromise = LoadTestRunner.stopTest();
        expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

        // Simulate process exit
        mockProcess.emit('exit');
        mockProcess.emit('close', 0);

        await Promise.all([testPromise, stopPromise]);
        expect(LoadTestRunner.currentTest).toBeNull();
    });

    it('force kills test after timeout', async () => {
        jest.useFakeTimers();

        const testPromise = LoadTestRunner.startTest({
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
        });

        // Stop test
        const stopPromise = LoadTestRunner.stopTest();
        expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');

        // Advance timer past force kill timeout
        jest.advanceTimersByTime(6000);

        expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');

        mockProcess.emit('exit');
        mockProcess.emit('close', 0);

        await Promise.all([testPromise, stopPromise]);
        jest.useRealTimers();
    });

    it('provides correct status information', async () => {
        // Initial status
        expect(LoadTestRunner.getStatus()).toEqual({
            isRunning: false,
            results: null,
            error: null,
        });

        // During test
        const testPromise = LoadTestRunner.startTest({
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
        });

        expect(LoadTestRunner.getStatus().isRunning).toBe(true);

        // After test completion
        const results = {
            type: 'results',
            data: { summary: { totalRequests: 1000 } },
        };
        mockStdout.emit('data', JSON.stringify(results));
        mockProcess.emit('close', 0);

        await testPromise;

        expect(LoadTestRunner.getStatus()).toEqual({
            isRunning: false,
            results: results.data,
            error: null,
        });
    });

    it('handles partial JSON data', async () => {
        const testPromise = LoadTestRunner.startTest({
            targetUrl: 'http://test.com',
            duration: '30s',
            vus: 10,
        });

        // Send partial JSON
        const json = JSON.stringify({
            type: 'results',
            data: { summary: { totalRequests: 1000 } },
        });
        
        mockStdout.emit('data', json.slice(0, 10));
        mockStdout.emit('data', json.slice(10));

        mockProcess.emit('close', 0);
        await testPromise;

        expect(LoadTestRunner.results).toEqual({
            summary: { totalRequests: 1000 },
        });
    });

    it('cleans up resources on process termination', () => {
        const processEvents = {};
        const originalProcess = { ...process };
        
        // Mock process.on
        process.on = jest.fn((event, handler) => {
            processEvents[event] = handler;
        });

        // Require module again to trigger listeners
        jest.isolateModules(() => {
            require('./notification_load_test');
        });

        // Verify SIGTERM handler
        expect(processEvents.SIGTERM).toBeDefined();
        expect(processEvents.SIGINT).toBeDefined();

        // Restore process
        process = originalProcess;
    });
});