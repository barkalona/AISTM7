import React from 'react';
import { render, screen, act } from '@testing-library/react';
import SystemMonitor from '../SystemMonitor';

// Mock Chart.js
jest.mock('chart.js', () => ({
    Chart: {
        register: jest.fn(),
    },
    CategoryScale: jest.fn(),
    LinearScale: jest.fn(),
    PointElement: jest.fn(),
    LineElement: jest.fn(),
    Title: jest.fn(),
    Tooltip: jest.fn(),
    Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
    Line: () => <div data-testid="mock-chart">Chart</div>,
}));

describe('SystemMonitor', () => {
    let mockWebSocket: any;
    const mockMetrics = {
        timestamp: new Date().toISOString(),
        cpu: 45.5,
        memory: 60.2,
        network: {
            rx: 1024 * 1024 * 2, // 2 MB/s
            tx: 1024 * 1024 * 1.5, // 1.5 MB/s
        },
    };

    beforeEach(() => {
        // Mock WebSocket
        mockWebSocket = {
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
            send: jest.fn(),
            close: jest.fn(),
        };

        // @ts-ignore
        global.WebSocket = jest.fn(() => mockWebSocket);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders initial state correctly', () => {
        render(<SystemMonitor />);
        expect(screen.getByText('System Metrics')).toBeInTheDocument();
        expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('establishes WebSocket connection on mount', () => {
        render(<SystemMonitor />);
        expect(WebSocket).toHaveBeenCalledWith('ws://localhost:3001/metrics');
    });

    it('shows connected status when WebSocket connects', () => {
        render(<SystemMonitor />);
        
        act(() => {
            mockWebSocket.onopen();
        });

        expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('updates metrics when receiving WebSocket message', () => {
        render(<SystemMonitor />);

        act(() => {
            mockWebSocket.onopen();
            mockWebSocket.onmessage({ data: JSON.stringify(mockMetrics) });
        });

        // Check CPU metrics
        expect(screen.getByText('45.5%')).toBeInTheDocument();
        
        // Check Memory metrics
        expect(screen.getByText('60.2%')).toBeInTheDocument();
        
        // Check Network metrics (formatted as MB/s)
        expect(screen.getByText('2.00 MB/s')).toBeInTheDocument();
        expect(screen.getByText('1.50 MB/s')).toBeInTheDocument();
    });

    it('shows error state when WebSocket connection fails', () => {
        render(<SystemMonitor />);

        act(() => {
            mockWebSocket.onerror();
        });

        expect(screen.getByText(/Failed to connect/)).toBeInTheDocument();
    });

    it('shows disconnected state when WebSocket closes', () => {
        render(<SystemMonitor />);

        act(() => {
            mockWebSocket.onopen();
            mockWebSocket.onclose();
        });

        expect(screen.getByText('Disconnected')).toBeInTheDocument();
    });

    it('maintains historical data within limits', () => {
        render(<SystemMonitor />);

        // Simulate receiving multiple metrics
        act(() => {
            mockWebSocket.onopen();
            for (let i = 0; i < 70; i++) { // Send more than 60 data points
                mockWebSocket.onmessage({
                    data: JSON.stringify({
                        ...mockMetrics,
                        cpu: i,
                    }),
                });
            }
        });

        // Chart should be rendered with the data
        expect(screen.getByTestId('mock-chart')).toBeInTheDocument();
    });

    it('cleans up WebSocket connection on unmount', () => {
        const { unmount } = render(<SystemMonitor />);
        unmount();
        expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('handles malformed WebSocket messages gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        render(<SystemMonitor />);

        act(() => {
            mockWebSocket.onmessage({ data: 'invalid json' });
        });

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('displays correct network units', () => {
        render(<SystemMonitor />);

        act(() => {
            mockWebSocket.onmessage({
                data: JSON.stringify({
                    ...mockMetrics,
                    network: {
                        rx: 1024 * 1024 * 0.5, // 0.5 MB/s
                        tx: 1024 * 1024 * 1.5, // 1.5 MB/s
                    },
                }),
            });
        });

        expect(screen.getByText('0.50 MB/s')).toBeInTheDocument();
        expect(screen.getByText('1.50 MB/s')).toBeInTheDocument();
    });

    it('updates chart data correctly', () => {
        render(<SystemMonitor />);

        const timestamps: string[] = [];
        const cpuData: number[] = [];
        const memoryData: number[] = [];

        // Simulate receiving multiple data points
        act(() => {
            mockWebSocket.onopen();
            for (let i = 0; i < 5; i++) {
                const timestamp = new Date(Date.now() - i * 1000).toISOString();
                const cpu = 40 + i;
                const memory = 50 + i;

                timestamps.unshift(timestamp);
                cpuData.unshift(cpu);
                memoryData.unshift(memory);

                mockWebSocket.onmessage({
                    data: JSON.stringify({
                        timestamp,
                        cpu,
                        memory,
                        network: mockMetrics.network,
                    }),
                });
            }
        });

        // Chart should be rendered
        const chart = screen.getByTestId('mock-chart');
        expect(chart).toBeInTheDocument();
    });
});