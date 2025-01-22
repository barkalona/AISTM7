import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
} from 'chart.js';
import useSystemMetrics from '@/hooks/useSystemMetrics';
import Loader from '@/components/ui/Loader';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const SystemMonitor: React.FC = () => {
    const {
        isConnected,
        error,
        metrics,
        getLatestMetrics,
        getAverageMetrics,
        getPeakMetrics,
    } = useSystemMetrics();

    const chartData: ChartData<'line'> = {
        labels: metrics.map((m) => {
            const date = new Date(m.timestamp);
            return date.toLocaleTimeString();
        }),
        datasets: [
            {
                label: 'CPU Usage (%)',
                data: metrics.map((m) => m.cpu),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1,
                fill: false,
            },
            {
                label: 'Memory Usage (%)',
                data: metrics.map((m) => m.memory),
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1,
                fill: false,
            },
            {
                label: 'Network RX (MB/s)',
                data: metrics.map((m) => m.network.rx / 1024 / 1024),
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1,
                fill: false,
            },
            {
                label: 'Network TX (MB/s)',
                data: metrics.map((m) => m.network.tx / 1024 / 1024),
                borderColor: 'rgb(54, 162, 235)',
                tension: 0.1,
                fill: false,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0, // Disable animation for better performance
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                title: {
                    display: true,
                    text: 'Usage (%)',
                },
            },
            y1: {
                position: 'right' as const,
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Network (MB/s)',
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'System Metrics',
            },
        },
    };

    if (error) {
        return (
            <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-red-700">{error}</p>
            </div>
        );
    }

    const latestMetrics = getLatestMetrics();
    const averageMetrics = getAverageMetrics(60); // Last minute average
    const peakMetrics = getPeakMetrics(60); // Last minute peaks

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">System Metrics</h2>
                <div className="flex items-center">
                    <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                            isConnected ? 'bg-green-500' : 'bg-red-500'
                        }`}
                    />
                    <span className="text-sm text-gray-600">
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {latestMetrics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-700">CPU Usage</h3>
                        <p className="text-2xl font-bold text-blue-900">
                            {latestMetrics.cpu.toFixed(1)}%
                        </p>
                        <div className="mt-1 text-sm text-blue-600">
                            <span>Avg: {averageMetrics?.cpu.toFixed(1)}%</span>
                            <span className="mx-2">|</span>
                            <span>Peak: {peakMetrics?.cpu.toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-purple-700">Memory Usage</h3>
                        <p className="text-2xl font-bold text-purple-900">
                            {latestMetrics.memory.toFixed(1)}%
                        </p>
                        <div className="mt-1 text-sm text-purple-600">
                            <span>Avg: {averageMetrics?.memory.toFixed(1)}%</span>
                            <span className="mx-2">|</span>
                            <span>Peak: {peakMetrics?.memory.toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-red-700">Network RX</h3>
                        <p className="text-2xl font-bold text-red-900">
                            {(latestMetrics.network.rx / 1024 / 1024).toFixed(2)} MB/s
                        </p>
                        <div className="mt-1 text-sm text-red-600">
                            <span>
                                Avg: {(averageMetrics?.network.rx || 0 / 1024 / 1024).toFixed(2)} MB/s
                            </span>
                            <span className="mx-2">|</span>
                            <span>
                                Peak: {(peakMetrics?.network.rx || 0 / 1024 / 1024).toFixed(2)} MB/s
                            </span>
                        </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-green-700">Network TX</h3>
                        <p className="text-2xl font-bold text-green-900">
                            {(latestMetrics.network.tx / 1024 / 1024).toFixed(2)} MB/s
                        </p>
                        <div className="mt-1 text-sm text-green-600">
                            <span>
                                Avg: {(averageMetrics?.network.tx || 0 / 1024 / 1024).toFixed(2)} MB/s
                            </span>
                            <span className="mx-2">|</span>
                            <span>
                                Peak: {(peakMetrics?.network.tx || 0 / 1024 / 1024).toFixed(2)} MB/s
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center items-center h-32">
                    <Loader size="lg" />
                </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow h-96">
                <Line data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default SystemMonitor;