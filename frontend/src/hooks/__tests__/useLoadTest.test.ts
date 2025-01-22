import { renderHook, act } from '@testing-library/react';
import useLoadTest from '../useLoadTest';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
    },
}));

describe('useLoadTest', () => {
    let mockFetch: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockFetch = jest.fn();
        global.fetch = mockFetch;
    });

    const mockConfig = {
        targetUrl: 'http://test.com',
        duration: '30s',
        vus: 10,
    };

    it('initializes with default state', () => {
        const { result } = renderHook(() => useLoadTest());

        expect(result.current.status).toEqual({
            status: 'idle',
            results: null,
            error: null,
        });
        expect(result.current.isRunning).toBe(false);
        expect(result.current.hasResults).toBe(false);
    });

    it('starts a load test successfully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ status: 'started' }),
        });

        const { result } = renderHook(() => useLoadTest());

        await act(async () => {
            await result.current.startTest(mockConfig);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/load-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'start',
                config: {
                    ...mockConfig,
                    rampUp: '1m',
                    rampDown: '1m',
                },
            }),
        });

        expect(result.current.status.status).toBe('running');
        expect(toast.success).toHaveBeenCalledWith('Load test started');
    });

    it('handles test start failure', async () => {
        const error = 'Test start failed';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error }),
        });

        const { result } = renderHook(() => useLoadTest());

        await act(async () => {
            await result.current.startTest(mockConfig);
        });

        expect(result.current.status.status).toBe('failed');
        expect(result.current.status.error).toBe(error);
        expect(toast.error).toHaveBeenCalledWith(`Failed to start test: ${error}`);
    });

    it('stops a running test', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ status: 'stopped' }),
        });

        const { result } = renderHook(() => useLoadTest());

        await act(async () => {
            await result.current.stopTest();
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/load-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'stop' }),
        });

        expect(toast.success).toHaveBeenCalledWith('Load test stopped');
    });

    it('handles test stop failure', async () => {
        const error = 'Test stop failed';
        mockFetch.mockResolvedValueOnce({
            ok: false,
            json: () => Promise.resolve({ error }),
        });

        const { result } = renderHook(() => useLoadTest());

        await act(async () => {
            await result.current.stopTest();
        });

        expect(toast.error).toHaveBeenCalledWith(`Failed to stop test: ${error}`);
    });

    it('polls for test status while running', async () => {
        jest.useFakeTimers();

        mockFetch
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ status: 'started' }),
            })
            .mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    isRunning: true,
                }),
            });

        const { result } = renderHook(() => useLoadTest());

        await act(async () => {
            await result.current.startTest(mockConfig);
        });

        expect(result.current.isRunning).toBe(true);

        // Fast-forward past polling interval
        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockFetch).toHaveBeenCalledWith('/api/load-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status' }),
        });

        jest.useRealTimers();
    });

    it('updates state when test completes', async () => {
        const mockResults = {
            summary: {
                totalRequests: 1000,
                failedRequests: 10,
                avgResponseTime: 150,
                p95ResponseTime: 450,
                requestsPerSecond: 50,
            },
        };

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({
                isRunning: false,
                results: mockResults,
            }),
        });

        const { result } = renderHook(() => useLoadTest());

        await act(async () => {
            await result.current.startTest(mockConfig);
        });

        expect(result.current.hasResults).toBe(true);
        expect(result.current.status.results).toEqual(mockResults);
    });

    it('resets test state', () => {
        const { result } = renderHook(() => useLoadTest());

        act(() => {
            result.current.resetTest();
        });

        expect(result.current.status).toEqual({
            status: 'idle',
            results: null,
            error: null,
        });
    });

    it('cleans up polling interval on unmount', async () => {
        jest.useFakeTimers();

        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ isRunning: true }),
        });

        const { result, unmount } = renderHook(() => useLoadTest());

        await act(async () => {
            await result.current.startTest(mockConfig);
        });

        unmount();

        // Fast-forward past polling interval
        await act(async () => {
            jest.advanceTimersByTime(1000);
        });

        // Fetch should not be called after unmount
        expect(mockFetch).toHaveBeenCalledTimes(1);

        jest.useRealTimers();
    });
});