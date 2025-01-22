import { GET, POST, PUT, DELETE } from '../route';
import { NextRequest } from 'next/server';

describe('Load Test API', () => {
  const createRequest = (method: string, body?: any, searchParams?: Record<string, string>) => {
    const url = new URL('http://localhost:3000/api/load-test');
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return new NextRequest(url, {
      method,
      ...(body && { body: JSON.stringify(body) })
    });
  };

  describe('GET', () => {
    it('should return a successful load test result', async () => {
      const req = createRequest('GET');
      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result).toHaveProperty('responseTime');
      expect(data.result).toHaveProperty('timestamp');
    });
  });

  describe('POST', () => {
    it('should handle load test with custom parameters', async () => {
      const req = createRequest('POST', {
        duration: 2000,
        concurrent: 2
      });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.totalRequests).toBe(2);
      expect(data.result.duration).toBe(2000);
      expect(Array.isArray(data.result.results)).toBe(true);
    });

    it('should use default parameters if none provided', async () => {
      const req = createRequest('POST', {});
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.result.totalRequests).toBe(1);
      expect(data.result.duration).toBe(1000);
    });
  });

  describe('PUT', () => {
    it('should update test configuration', async () => {
      const req = createRequest('PUT', {
        testId: '123'
      });
      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Test 123 updated');
    });

    it('should handle update errors', async () => {
      const req = createRequest('PUT', {});
      const response = await PUT(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('DELETE', () => {
    it('should delete test configuration', async () => {
      const req = createRequest('DELETE', null, { testId: '123' });
      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Test 123 deleted');
    });

    it('should require testId parameter', async () => {
      const req = createRequest('DELETE');
      const response = await DELETE(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Test ID required');
    });
  });
});