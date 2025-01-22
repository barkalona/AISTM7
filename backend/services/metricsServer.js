const WebSocket = require('ws');
const os = require('os');

class MetricsServer {
    constructor(port = 3001) {
        this.port = port;
        this.wss = null;
        this.clients = new Set();
        this.metricsInterval = null;
    }

    start() {
        this.wss = new WebSocket.Server({ port: this.port });
        console.log(`Metrics WebSocket server started on port ${this.port}`);

        this.wss.on('connection', (ws) => {
            console.log('Client connected to metrics server');
            this.clients.add(ws);

            ws.on('close', () => {
                console.log('Client disconnected from metrics server');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });

            // Start sending metrics if this is the first client
            if (this.clients.size === 1) {
                this.startMetricsCollection();
            }
        });

        this.wss.on('error', (error) => {
            console.error('WebSocket server error:', error);
        });
    }

    stop() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }

        if (this.wss) {
            this.wss.close(() => {
                console.log('Metrics WebSocket server stopped');
            });
        }

        this.clients.clear();
    }

    startMetricsCollection() {
        if (this.metricsInterval) return;

        let lastCpuInfo = this.getCpuInfo();
        let lastNetworkInfo = this.getNetworkInfo();

        this.metricsInterval = setInterval(() => {
            try {
                // CPU Usage
                const currentCpuInfo = this.getCpuInfo();
                const cpuUsage = this.calculateCpuUsage(lastCpuInfo, currentCpuInfo);
                lastCpuInfo = currentCpuInfo;

                // Memory Usage
                const memoryUsage = this.getMemoryUsage();

                // Network Usage
                const currentNetworkInfo = this.getNetworkInfo();
                const networkUsage = this.calculateNetworkUsage(lastNetworkInfo, currentNetworkInfo);
                lastNetworkInfo = currentNetworkInfo;

                const metrics = {
                    timestamp: new Date().toISOString(),
                    cpu: cpuUsage,
                    memory: memoryUsage,
                    network: networkUsage
                };

                // Send metrics to all connected clients
                const payload = JSON.stringify(metrics);
                for (const client of this.clients) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(payload);
                    }
                }
            } catch (error) {
                console.error('Error collecting metrics:', error);
            }
        }, 1000); // Collect metrics every second
    }

    getCpuInfo() {
        const cpus = os.cpus();
        return cpus.reduce((acc, cpu) => {
            acc.idle += cpu.times.idle;
            acc.total += Object.values(cpu.times).reduce((a, b) => a + b, 0);
            return acc;
        }, { idle: 0, total: 0 });
    }

    calculateCpuUsage(lastInfo, currentInfo) {
        const idleDiff = currentInfo.idle - lastInfo.idle;
        const totalDiff = currentInfo.total - lastInfo.total;
        const usage = 100 - (idleDiff / totalDiff * 100);
        return Math.round(usage * 100) / 100; // Round to 2 decimal places
    }

    getMemoryUsage() {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const used = totalMem - freeMem;
        return Math.round((used / totalMem * 100) * 100) / 100;
    }

    getNetworkInfo() {
        const networkInterfaces = os.networkInterfaces();
        let totalRx = 0;
        let totalTx = 0;

        Object.values(networkInterfaces).forEach(interfaces => {
            interfaces?.forEach(interface => {
                if (interface.internal) return; // Skip loopback interface
                // Note: This is just an example, actual network stats would need a more sophisticated approach
                totalRx += Math.random() * 1024 * 1024; // Simulate random network activity
                totalTx += Math.random() * 1024 * 1024;
            });
        });

        return { rx: totalRx, tx: totalTx };
    }

    calculateNetworkUsage(lastInfo, currentInfo) {
        return {
            rx: currentInfo.rx - lastInfo.rx,
            tx: currentInfo.tx - lastInfo.tx
        };
    }
}

module.exports = MetricsServer;