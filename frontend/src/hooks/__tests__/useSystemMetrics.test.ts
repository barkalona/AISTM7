import { renderHook, act } from '@testing-library/react';
import { useSystemMetrics } from '../useSystemMetrics';

describe('useSystemMetrics', () => {
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
        // Mock WebSocket implementation
        mockWebSocket = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: jest.fn(),
        };

        // @ts-ignore
        global.WebSocket = jest.fn(() => mockWebSocket);

        // Mock console methods
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useSystemMetrics());

        expect(result.current.isConnected).toBe(false);
        expect(result.current.error).toBeNull();
        expect(result.current.metrics).toEqual([]);
        expect(WebSocket).toHaveBeenCalledWith('ws://localhost:3001/metrics');
    });

    it('connects to custom WebSocket URL', () => {
        const customUrl = 'ws://custom-url:8080';
        renderHook(() => useSystemMetrics({ url: customUrl }));

        expect(WebSocket).toHaveBeenCalledWith(customUrl);
    });

    it('updates connection status on WebSocket open', () => {
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onopen();
        });

        expect(result.current.isConnected).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('handles WebSocket messages and updates metrics', () => {
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onopen();
            mockWebSocket.onmessage({ data: JSON.stringify(mockMetrics) });
        });

        expect(result.current.metrics).toHaveLength(1);
        expect(result.current.getLatestMetrics()).toEqual(mockMetrics);
    });

    it('limits metrics history to maxDataPoints', () => {
        const maxDataPoints = 3;
        const { result } = renderHook(() => useSystemMetrics({ maxDataPoints }));

        act(() => {
            mockWebSocket.onopen();
            for (let i = 0; i < 5; i++) {
                mockWebSocket.onmessage({
                    data: JSON.stringify({
                        ...mockMetrics,
                        cpu: i,
                    }),
                });
            }
        });

        expect(result.current.metrics).toHaveLength(maxDataPoints);
        expect(result.current.getLatestMetrics()?.cpu).toBe(4);
    });

    it('handles WebSocket errors', () => {
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onerror(new Error('WebSocket error'));
        });

        expect(result.current.error).toBe('Failed to connect to metrics server');
        expect(result.current.isConnected).toBe(false);
    });

    it('handles WebSocket close', () => {
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onopen();
            mockWebSocket.onclose();
        });

        expect(result.current.isConnected).toBe(false);
    });

    it('calculates average metrics correctly', () => {
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onopen();
            for (let i = 0; i < 3; i++) {
                mockWebSocket.onmessage({
                    data: JSON.stringify({
                        ...mockMetrics,
                        cpu: i * 10, // 0, 10, 20
                        memory: i * 20, // 0, 20, 40
                    }),
                });
            }
        });

        const avgMetrics = result.current.getAverageMetrics(3);
        expect(avgMetrics?.cpu).toBe(10); // (0 + 10 + 20) / 3
        expect(avgMetrics?.memory).toBe(20); // (0 + 20 + 40) / 3
    });

    it('calculates peak metrics correctly', () => {
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onopen();
            for (let i = 0; i < 3; i++) {
                mockWebSocket.onmessage({
                    data: JSON.stringify({
                        ...mockMetrics,
                        cpu: i * 10, // 0, 10, 20
                        memory: i * 20, // 0, 20, 40
                    }),
                });
            }
        });

        const peakMetrics = result.current.getPeakMetrics(3);
        expect(peakMetrics?.cpu).toBe(20);
        expect(peakMetrics?.memory).toBe(40);
    });

    it('handles malformed WebSocket messages', () => {
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onopen();
            mockWebSocket.onmessage({ data: 'invalid json' });
        });

        expect(result.current.metrics).toHaveLength(0);
        expect(console.error).toHaveBeenCalled();
    });

    it('cleans up WebSocket connection on unmount', () => {
        const { unmount } = renderHook(() => useSystemMetrics());

        unmount();

        expect(mockWebSocket.close).toHaveBeenCalled();
    });

    it('attempts to reconnect on connection close', () => {
        jest.useFakeTimers();
        const { result } = renderHook(() => useSystemMetrics());

        act(() => {
            mockWebSocket.onclose();
            jest.advanceTimersByTime(1000); // Advance past reconnect delay
        });

        expect(WebSocket).toHaveBeenCalledTimes(2);
        jest.useRealTimers();
    });

    it('stops reconnecting after max attempts', () => {
        jest.useFakeTimers();
        const { result } = renderHook(() => useSystemMetrics());

        // Simulate 6 connection failures (exceeding the 5 max attempts)
        act(() => {
            for (let i = 0; i < 6; i++) {
                mockWebSocket.onclose();
                jest.advanceTimersByTime(1000 * Math.pow(2, i)); // Exponential backoff
            }
        });

        expect(result.current.error).toBe('Maximum reconnection attempts reached');
        jest.useRealTimers();
    });
});