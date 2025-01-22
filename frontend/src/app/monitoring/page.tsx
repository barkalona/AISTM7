import React from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import SystemMonitor from '@/components/SystemMonitor';
import useLoadTest from '@/hooks/useLoadTest';
import Loader from '@/components/ui/Loader';

const MonitoringPage = () => {
    const { data: session, status: sessionStatus } = useSession();
    const {
        status,
        startTest,
        stopTest,
        isRunning,
        hasResults,
        error: loadTestError
    } = useLoadTest();

    const [testConfig, setTestConfig] = React.useState({
        duration: '5m',
        vus: 50,
        targetUrl: 'http://localhost:3000'
    });

    // Protect route
    if (sessionStatus === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader size="lg" />
            </div>
        );
    }

    if (!session) {
        redirect('/auth/signin');
    }

    const handleStartTest = async () => {
        await startTest({
            ...testConfig,
            rampUp: '1m',
            rampDown: '1m'
        });
    };

    const handleStopTest = async () => {
        await stopTest();
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
                <p className="text-gray-600">
                    Real-time system metrics and performance monitoring
                </p>
            </div>

            {/* System Monitor */}
            <div className="mb-8">
                <SystemMonitor />
            </div>

            {/* Load Test Controls */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Load Testing</h2>
                    {isRunning && (
                        <div className="flex items-center text-yellow-600">
                            <Loader size="sm" className="mr-2" />
                            Test Running
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Duration</label>
                        <select
                            value={testConfig.duration}
                            onChange={(e) => setTestConfig(prev => ({
                                ...prev,
                                duration: e.target.value
                            }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isRunning}
                        >
                            <option value="1m">1 minute</option>
                            <option value="5m">5 minutes</option>
                            <option value="10m">10 minutes</option>
                            <option value="30m">30 minutes</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Virtual Users</label>
                        <input
                            type="number"
                            value={testConfig.vus}
                            onChange={(e) => setTestConfig(prev => ({
                                ...prev,
                                vus: parseInt(e.target.value)
                            }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isRunning}
                            min={1}
                            max={1000}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target URL</label>
                        <input
                            type="text"
                            value={testConfig.targetUrl}
                            onChange={(e) => setTestConfig(prev => ({
                                ...prev,
                                targetUrl: e.target.value
                            }))}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            disabled={isRunning}
                            placeholder="http://localhost:3000"
                        />
                    </div>
                </div>

                {loadTestError && (
                    <div className="mb-4 p-4 bg-red-50 rounded-lg">
                        <p className="text-red-700">{loadTestError}</p>
                    </div>
                )}

                <div className="flex justify-end">
                    {isRunning ? (
                        <button
                            onClick={handleStopTest}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Stop Test
                        </button>
                    ) : (
                        <button
                            onClick={handleStartTest}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                            disabled={!testConfig.targetUrl}
                        >
                            Start Test
                        </button>
                    )}
                </div>
            </div>

            {/* Test Results */}
            {hasResults && status.results && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-4">Test Results</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-blue-700">Total Requests</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {status.results.summary.totalRequests.toLocaleString()}
                            </p>
                        </div>

                        <div className="p-4 bg-red-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-red-700">Failed Requests</h3>
                            <p className="text-3xl font-bold text-red-600">
                                {status.results.summary.failedRequests.toLocaleString()}
                            </p>
                            <p className="text-sm text-red-500">
                                ({((status.results.summary.failedRequests / status.results.summary.totalRequests) * 100).toFixed(2)}%)
                            </p>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-700">Avg Response Time</h3>
                            <p className="text-3xl font-bold text-green-600">
                                {status.results.summary.avgResponseTime.toFixed(2)}ms
                            </p>
                            <p className="text-sm text-green-500">
                                P95: {status.results.summary.p95ResponseTime.toFixed(2)}ms
                            </p>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg">
                            <h3 className="text-lg font-semibold text-purple-700">Requests/Second</h3>
                            <p className="text-3xl font-bold text-purple-600">
                                {status.results.summary.requestsPerSecond.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringPage;