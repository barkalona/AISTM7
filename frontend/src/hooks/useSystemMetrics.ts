import { useState, useEffect, useCallback } from 'react';

export interface SystemMetrics {
    timestamp: string;
    cpu: number;
    memory: number;
    network: {
        rx: number;
        tx: number;
    };
}

interface UseSystemMetricsOptions {
    maxDataPoints?: number;
    url?: string;
}

export function useSystemMetrics(options: UseSystemMetricsOptions = {}) {
    const {
        maxDataPoints = 60, // 1 minute of data at 1 data point per second
        url = 'ws://localhost:3001/metrics'
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [metrics, setMetrics] = useState<SystemMetrics[]>([]);

    const addMetric = useCallback((newMetric: SystemMetrics) => {
        setMetrics(prevMetrics => {
            const updatedMetrics = [...prevMetrics, newMetric];
            // Keep only the last maxDataPoints
            return updatedMetrics.slice(-maxDataPoints);
        });
    }, [maxDataPoints]);

    useEffect(() => {
        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;
        const baseReconnectDelay = 1000; // Start with 1 second

        const connect = () => {
            try {
                ws = new WebSocket(url);

                ws.onopen = () => {
                    setIsConnected(true);
                    setError(null);
                    reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                };

                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        addMetric(data);
                    } catch (err) {
                        console.error('Failed to parse metrics:', err);
                    }
                };

                ws.onerror = (event) => {
                    console.error('WebSocket error:', event);
                    setError('Failed to connect to metrics server');
                };

                ws.onclose = () => {
                    setIsConnected(false);
                    
                    // Attempt to reconnect with exponential backoff
                    if (reconnectAttempts < maxReconnectAttempts) {
                        const delay = Math.min(
                            baseReconnectDelay * Math.pow(2, reconnectAttempts),
                            30000 // Max delay of 30 seconds
                        );
                        
                        reconnectTimeout = setTimeout(() => {
                            reconnectAttempts++;
                            connect();
                        }, delay);
                    } else {
                        setError('Maximum reconnection attempts reached');
                    }
                };
            } catch (err) {
                console.error('Failed to create WebSocket:', err);
                setError('Failed to connect to metrics server');
            }
        };

        connect();

        // Cleanup function
        return () => {
            if (ws) {
                ws.close();
            }
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
        };
    }, [url, addMetric]);

    const getLatestMetrics = useCallback(() => {
        return metrics[metrics.length - 1] || null;
    }, [metrics]);

    const getMetricsHistory = useCallback(() => {
        return metrics;
    }, [metrics]);

    const getAverageMetrics = useCallback((duration: number = 60) => {
        const relevantMetrics = metrics.slice(-duration);
        if (relevantMetrics.length === 0) return null;

        const sum = relevantMetrics.reduce(
            (acc, metric) => ({
                cpu: acc.cpu + metric.cpu,
                memory: acc.memory + metric.memory,
                network: {
                    rx: acc.network.rx + metric.network.rx,
                    tx: acc.network.tx + metric.network.tx,
                },
            }),
            { cpu: 0, memory: 0, network: { rx: 0, tx: 0 } }
        );

        return {
            cpu: sum.cpu / relevantMetrics.length,
            memory: sum.memory / relevantMetrics.length,
            network: {
                rx: sum.network.rx / relevantMetrics.length,
                tx: sum.network.tx / relevantMetrics.length,
            },
        };
    }, [metrics]);

    const getPeakMetrics = useCallback((duration: number = 60) => {
        const relevantMetrics = metrics.slice(-duration);
        if (relevantMetrics.length === 0) return null;

        return relevantMetrics.reduce(
            (peak, metric) => ({
                cpu: Math.max(peak.cpu, metric.cpu),
                memory: Math.max(peak.memory, metric.memory),
                network: {
                    rx: Math.max(peak.network.rx, metric.network.rx),
                    tx: Math.max(peak.network.tx, metric.network.tx),
                },
            }),
            { cpu: 0, memory: 0, network: { rx: 0, tx: 0 } }
        );
    }, [metrics]);

    return {
        isConnected,
        error,
        metrics,
        getLatestMetrics,
        getMetricsHistory,
        getAverageMetrics,
        getPeakMetrics,
    };
}

export default useSystemMetrics;