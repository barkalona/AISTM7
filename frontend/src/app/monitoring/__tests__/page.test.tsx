import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import MonitoringPage from '../page';
import useLoadTest from '@/hooks/useLoadTest';
import useSystemMetrics from '@/hooks/useSystemMetrics';

// Mock dependencies
jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/hooks/useLoadTest');
jest.mock('@/hooks/useSystemMetrics');
jest.mock('@/components/SystemMonitor', () => ({
    __esModule: true,
    default: () => <div data-testid="system-monitor">System Monitor</div>
}));

describe('MonitoringPage', () => {
    const mockSession = {
        data: {
            user: { id: 'test-user', email: 'test@example.com' }
        },
        status: 'authenticated'
    };

    const mockLoadTest = {
        status: {
            status: 'idle',
            results: null
        },
        startTest: jest.fn(),
        stopTest: jest.fn(),
        isRunning: false,
        hasResults: false,
        error: null
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useSession as jest.Mock).mockReturnValue(mockSession);
        (useLoadTest as jest.Mock).mockReturnValue(mockLoadTest);
        (useSystemMetrics as jest.Mock).mockReturnValue({
            isConnected: true,
            error: null,
            metrics: []
        });
    });

    it('redirects to signin when not authenticated', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'unauthenticated'
        });

        render(<MonitoringPage />);
        expect(redirect).toHaveBeenCalledWith('/auth/signin');
    });

    it('shows loading state while session is loading', () => {
        (useSession as jest.Mock).mockReturnValue({
            data: null,
            status: 'loading'
        });

        render(<MonitoringPage />);
        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('renders monitoring page with system monitor', () => {
        render(<MonitoringPage />);

        expect(screen.getByText('System Monitoring')).toBeInTheDocument();
        expect(screen.getByTestId('system-monitor')).toBeInTheDocument();
    });

    it('handles starting a load test', async () => {
        const user = userEvent.setup();
        render(<MonitoringPage />);

        const targetUrlInput = screen.getByLabelText(/Target URL/);
        await user.clear(targetUrlInput);
        await user.type(targetUrlInput, 'http://test.com');

        const vusInput = screen.getByLabelText(/Virtual Users/);
        await user.clear(vusInput);
        await user.type(vusInput, '100');

        const startButton = screen.getByText('Start Test');
        await user.click(startButton);

        expect(mockLoadTest.startTest).toHaveBeenCalledWith({
            duration: '5m',
            vus: 100,
            rampUp: '1m',
            rampDown: '1m',
            targetUrl: 'http://test.com'
        });
    });

    it('handles stopping a load test', async () => {
        const user = userEvent.setup();
        (useLoadTest as jest.Mock).mockReturnValue({
            ...mockLoadTest,
            isRunning: true
        });

        render(<MonitoringPage />);

        const stopButton = screen.getByText('Stop Test');
        await user.click(stopButton);

        expect(mockLoadTest.stopTest).toHaveBeenCalled();
    });

    it('disables form inputs while test is running', () => {
        (useLoadTest as jest.Mock).mockReturnValue({
            ...mockLoadTest,
            isRunning: true
        });

        render(<MonitoringPage />);

        expect(screen.getByLabelText(/Virtual Users/)).toBeDisabled();
        expect(screen.getByLabelText(/Target URL/)).toBeDisabled();
        expect(screen.getByRole('combobox')).toBeDisabled();
    });

    it('displays test results when available', () => {
        const mockResults = {
            summary: {
                totalRequests: 1000,
                failedRequests: 10,
                avgResponseTime: 200,
                p95ResponseTime: 500,
                requestsPerSecond: 50
            }
        };

        (useLoadTest as jest.Mock).mockReturnValue({
            ...mockLoadTest,
            hasResults: true,
            status: {
                status: 'completed',
                results: mockResults
            }
        });

        render(<MonitoringPage />);

        expect(screen.getByText('Test Results')).toBeInTheDocument();
        expect(screen.getByText('1,000')).toBeInTheDocument(); // Total Requests
        expect(screen.getByText('200.00ms')).toBeInTheDocument(); // Avg Response Time
        expect(screen.getByText('50.00')).toBeInTheDocument(); // Requests/Second
    });

    it('displays error message when load test fails', () => {
        const errorMessage = 'Test failed due to system overload';
        (useLoadTest as jest.Mock).mockReturnValue({
            ...mockLoadTest,
            error: errorMessage
        });

        render(<MonitoringPage />);
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('validates form inputs before starting test', async () => {
        const user = userEvent.setup();
        render(<MonitoringPage />);

        // Clear target URL
        const targetUrlInput = screen.getByLabelText(/Target URL/);
        await user.clear(targetUrlInput);

        const startButton = screen.getByText('Start Test');
        expect(startButton).toBeDisabled();

        // Enter invalid VUs
        const vusInput = screen.getByLabelText(/Virtual Users/);
        await user.clear(vusInput);
        await user.type(vusInput, '1001');

        expect(startButton).toBeDisabled();
    });

    it('shows running indicator during test', () => {
        (useLoadTest as jest.Mock).mockReturnValue({
            ...mockLoadTest,
            isRunning: true
        });

        render(<MonitoringPage />);
        expect(screen.getByText('Test Running')).toBeInTheDocument();
    });
});