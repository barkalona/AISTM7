import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { POST, GET, PUT, DELETE } from '../route';
import loadTestRunner from '../../../../../../backend/tests/performance/notification_load_test';

// Mock dependencies
jest.mock('next-auth');
jest.mock('../../../../../../backend/tests/performance/notification_load_test');

describe('Load Test API', () => {
    const mockSession = {
        user: { id: 'test-user', email: 'test@example.com' }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (getServerSession as jest.Mock).mockResolvedValue(mockSession);
        (loadTestRunner.getStatus as jest.Mock).mockReturnValue({
            isRunning: false,
            results: null,
            error: null
        });
    });

    describe('POST /api/load-test', () => {
        const createRequest = (body: any) => {
            return new NextRequest('http://localhost:3000/api/load-test', {
                method: 'POST',
                body: JSON.stringify(body)
            });
        };

        it('requires authentication', async () => {
            (getServerSession as jest.Mock).mockResolvedValue(null);
            const req = createRequest({ action: 'status' });
            const response = await POST(req);
            
            expect(response.status).toBe(401);
            expect(await response.json()).toEqual({
                error: 'Authentication required'
            });
        });

        it('validates test configuration', async () => {
            const invalidConfigs = [
                { action: 'start', config: null },
                { action: 'start', config: { targetUrl: null } },
                { action: 'start', config: { targetUrl: 'invalid-url' } },
                { action: 'start', config: { targetUrl: 'http://test.com', duration: null } },
                { action: 'start', config: { targetUrl: 'http://test.com', duration: '30x' } },
                { action: 'start', config: { targetUrl: 'http://test.com', duration: '30s', vus: 0 } },
                { action: 'start', config: { targetUrl: 'http://test.com', duration: '30s', vus: 1001 } },
            ];

            for (const config of invalidConfigs) {
                const req = createRequest(config);
                const response = await POST(req);
                expect(response.status).toBe(400);
                expect(await response.json()).toHaveProperty('error');
            }
        });

        it('starts a load test with valid configuration', async () => {
            const config = {
                action: 'start',
                config: {
                    targetUrl: 'http://test.com',
                    duration: '30s',
                    vus: 10
                }
            };

            const req = createRequest(config);
            const response = await POST(req);

            expect(loadTestRunner.startTest).toHaveBeenCalledWith(config.config);
            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ status: 'started' });
        });

        it('prevents starting multiple tests', async () => {
            (loadTestRunner.getStatus as jest.Mock).mockReturnValue({
                isRunning: true
            });

            const config = {
                action: 'start',
                config: {
                    targetUrl: 'http://test.com',
                    duration: '30s',
                    vus: 10
                }
            };

            const req = createRequest(config);
            const response = await POST(req);

            expect(response.status).toBe(409);
            expect(await response.json()).toEqual({
                error: 'Test already in progress'
            });
        });

        it('stops a running test', async () => {
            const req = createRequest({ action: 'stop' });
            const response = await POST(req);

            expect(loadTestRunner.stopTest).toHaveBeenCalled();
            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({ status: 'stopped' });
        });

        it('returns test status', async () => {
            const mockStatus = {
                isRunning: false,
                results: {
                    summary: {
                        totalRequests: 1000,
                        failedRequests: 10
                    }
                },
                error: null
            };

            (loadTestRunner.getStatus as jest.Mock).mockReturnValue(mockStatus);

            const req = createRequest({ action: 'status' });
            const response = await POST(req);

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual(mockStatus);
        });

        it('handles invalid actions', async () => {
            const req = createRequest({ action: 'invalid' });
            const response = await POST(req);

            expect(response.status).toBe(400);
            expect(await response.json()).toEqual({
                error: 'Invalid action'
            });
        });

        it('handles test start errors', async () => {
            const error = new Error('Test start failed');
            (loadTestRunner.startTest as jest.Mock).mockRejectedValue(error);

            const config = {
                action: 'start',
                config: {
                    targetUrl: 'http://test.com',
                    duration: '30s',
                    vus: 10
                }
            };

            const req = createRequest(config);
            const response = await POST(req);

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: error.message
            });
        });

        it('handles test stop errors', async () => {
            const error = new Error('Test stop failed');
            (loadTestRunner.stopTest as jest.Mock).mockRejectedValue(error);

            const req = createRequest({ action: 'stop' });
            const response = await POST(req);

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: error.message
            });
        });
    });

    describe('Other HTTP Methods', () => {
        it('rejects GET requests', async () => {
            const response = await GET();
            expect(response.status).toBe(405);
            expect(await response.json()).toEqual({
                error: 'Method not allowed'
            });
        });

        it('rejects PUT requests', async () => {
            const response = await PUT();
            expect(response.status).toBe(405);
            expect(await response.json()).toEqual({
                error: 'Method not allowed'
            });
        });

        it('rejects DELETE requests', async () => {
            const response = await DELETE();
            expect(response.status).toBe(405);
            expect(await response.json()).toEqual({
                error: 'Method not allowed'
            });
        });
    });
});