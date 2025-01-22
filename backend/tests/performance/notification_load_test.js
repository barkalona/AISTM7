const { spawn } = require('child_process');
const path = require('path');
const EventEmitter = require('events');

class LoadTestRunner extends EventEmitter {
    constructor() {
        super();
        this.currentTest = null;
        this.results = null;
        this.error = null;
    }

    async startTest(config) {
        if (this.currentTest) {
            throw new Error('Test already running');
        }

        this.error = null;
        this.results = null;

        const k6Path = process.env.K6_PATH || 'k6';
        const scriptPath = path.join(__dirname, 'run_load_test.js');

        // Prepare environment variables for k6
        const env = {
            ...process.env,
            TEST_TARGET: config.targetUrl,
            TEST_DURATION: config.duration,
            TEST_VUS: config.vus.toString(),
            TEST_RAMP_UP: config.rampUp,
            TEST_RAMP_DOWN: config.rampDown,
            NODE_ENV: process.env.NODE_ENV || 'production'
        };

        return new Promise((resolve, reject) => {
            try {
                this.currentTest = spawn(k6Path, ['run', scriptPath], { env });

                let outputBuffer = '';

                this.currentTest.stdout.on('data', (data) => {
                    const output = data.toString();
                    outputBuffer += output;

                    // Try to parse JSON messages from the output
                    let startIndex;
                    while ((startIndex = outputBuffer.indexOf('{')) !== -1) {
                        try {
                            const possibleJson = outputBuffer.slice(startIndex);
                            const message = JSON.parse(possibleJson);
                            
                            if (message.type === 'results') {
                                this.results = message.data;
                                this.emit('results', message.data);
                            }
                            
                            // Remove processed JSON from buffer
                            outputBuffer = outputBuffer.slice(startIndex + possibleJson.length);
                        } catch (e) {
                            // Not valid JSON yet, wait for more data
                            break;
                        }
                    }

                    // Emit raw output for logging/debugging
                    this.emit('output', output);
                });

                this.currentTest.stderr.on('data', (data) => {
                    const error = data.toString();
                    this.error = error;
                    this.emit('error', error);
                });

                this.currentTest.on('close', (code) => {
                    this.currentTest = null;

                    if (code === 0) {
                        resolve(this.results);
                    } else {
                        const error = new Error(`Load test failed with exit code ${code}`);
                        error.code = code;
                        error.output = outputBuffer;
                        reject(error);
                    }
                });

                // Handle process errors
                this.currentTest.on('error', (error) => {
                    this.currentTest = null;
                    this.error = error.message;
                    reject(error);
                });

            } catch (error) {
                this.currentTest = null;
                this.error = error.message;
                reject(error);
            }
        });
    }

    stopTest() {
        return new Promise((resolve, reject) => {
            if (!this.currentTest) {
                resolve();
                return;
            }

            const cleanup = () => {
                this.currentTest = null;
                resolve();
            };

            try {
                // Send SIGTERM to k6 process
                this.currentTest.kill('SIGTERM');

                // Set a timeout to force kill if graceful shutdown fails
                const forceKillTimeout = setTimeout(() => {
                    if (this.currentTest) {
                        this.currentTest.kill('SIGKILL');
                    }
                }, 5000);

                // Clean up when process exits
                this.currentTest.on('exit', () => {
                    clearTimeout(forceKillTimeout);
                    cleanup();
                });

            } catch (error) {
                cleanup();
                reject(error);
            }
        });
    }

    getStatus() {
        return {
            isRunning: !!this.currentTest,
            results: this.results,
            error: this.error
        };
    }
}

// Export singleton instance
const loadTestRunner = new LoadTestRunner();
module.exports = loadTestRunner;

// Handle process termination
process.on('SIGTERM', async () => {
    await loadTestRunner.stopTest();
    process.exit(0);
});

process.on('SIGINT', async () => {
    await loadTestRunner.stopTest();
    process.exit(0);
});

// Example usage:
if (require.main === module) {
    const runner = new LoadTestRunner();

    runner.on('output', (output) => {
        console.log('[k6]', output);
    });

    runner.on('error', (error) => {
        console.error('[k6 error]', error);
    });

    runner.on('results', (results) => {
        console.log('[k6 results]', JSON.stringify(results, null, 2));
    });

    // Example test configuration
    const config = {
        targetUrl: 'http://localhost:3000',
        duration: '30s',
        vus: 10,
        rampUp: '5s',
        rampDown: '5s'
    };

    runner.startTest(config)
        .then(() => {
            console.log('Test completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}