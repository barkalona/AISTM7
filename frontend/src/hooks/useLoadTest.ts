import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export interface LoadTestConfig {
    targetUrl: string;
    duration: string;
    vus: number;
    rampUp?: string;
    rampDown?: string;
}

export interface LoadTestResults {
    summary: {
        totalRequests: number;
        failedRequests: number;
        avgResponseTime: number;
        p95ResponseTime: number;
        requestsPerSecond: number;
    };
}

export interface LoadTestStatus {
    status: 'idle' | 'running' | 'completed' | 'failed';
    results: LoadTestResults | null;
    error: string | null;
}

const useLoadTest = () => {
    const [status, setStatus] = useState<LoadTestStatus>({
        status: 'idle',
        results: null,
        error: null,
    });

    // Poll for test status when running
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;

        const pollStatus = async () => {
            try {
                const response = await fetch('/api/load-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'status' }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch test status');
                }

                const data = await response.json();

                if (data.error) {
                    setStatus(prev => ({
                        ...prev,
                        status: 'failed',
                        error: data.error,
                    }));
                    return;
                }

                // Update status based on test runner state
                if (data.isRunning) {
                    setStatus(prev => ({
                        ...prev,
                        status: 'running',
                    }));
                } else if (data.results) {
                    setStatus({
                        status: 'completed',
                        results: data.results,
                        error: null,
                    });
                }
            } catch (error) {
                console.error('Error polling test status:', error);
            }
        };

        if (status.status === 'running') {
            pollInterval = setInterval(pollStatus, 1000);
        }

        return () => {
            if (pollInterval) {
                clearInterval(pollInterval);
            }
        };
    }, [status.status]);

    const startTest = useCallback(async (config: LoadTestConfig) => {
        try {
            setStatus({
                status: 'running',
                results: null,
                error: null,
            });

            const response = await fetch('/api/load-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'start',
                    config: {
                        ...config,
                        rampUp: config.rampUp || '1m',
                        rampDown: config.rampDown || '1m',
                    },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to start load test');
            }

            toast.success('Load test started');
        } catch (error: any) {
            setStatus({
                status: 'failed',
                results: null,
                error: error.message,
            });
            toast.error(`Failed to start test: ${error.message}`);
        }
    }, []);

    const stopTest = useCallback(async () => {
        try {
            const response = await fetch('/api/load-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stop' }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to stop load test');
            }

            toast.success('Load test stopped');
        } catch (error: any) {
            toast.error(`Failed to stop test: ${error.message}`);
        }
    }, []);

    const resetTest = useCallback(() => {
        setStatus({
            status: 'idle',
            results: null,
            error: null,
        });
    }, []);

    return {
        status,
        startTest,
        stopTest,
        resetTest,
        isRunning: status.status === 'running',
        hasResults: status.status === 'completed' && status.results !== null,
        error: status.error,
    };
};

export default useLoadTest;