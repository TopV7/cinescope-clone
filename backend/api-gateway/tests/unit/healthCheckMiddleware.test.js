import { jest } from '@jest/globals';
import { healthCheckMiddleware } from '../../src/middleware/proxy.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('healthCheckMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
    global.fetch.mockClear();
    global.fetch.mockResolvedValue({
      ok: true,
      headers: new Map([['x-response-time', '100ms']])
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add servicesHealth to req with healthy services', async () => {
    // Mock successful responses
    global.fetch.mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        headers: new Map([['x-response-time', '100ms']])
      });
    });

    await new Promise((resolve) => {
      healthCheckMiddleware(req, res, () => {
        resolve();
      });
    });

    expect(req.servicesHealth).toBeDefined();
    expect(req.servicesHealth).toHaveLength(3);
    expect(req.servicesHealth[0]).toMatchObject({
      name: 'Auth Service',
      status: 'healthy',
      responseTime: '100ms'
    });
    expect(req.servicesHealth[1]).toMatchObject({
      name: 'Movies Service',
      status: 'healthy'
    });
    expect(req.servicesHealth[2]).toMatchObject({
      name: 'Payment Service',
      status: 'healthy'
    });
    expect(next).toHaveBeenCalled();
  });

  it('should handle unhealthy services', async () => {
    // Mock one failed response
    global.fetch.mockImplementation((url) => {
      if (url.includes('auth')) {
        return Promise.reject(new Error('Connection refused'));
      }
      return Promise.resolve({
        ok: true,
        headers: new Map()
      });
    });

    await new Promise((resolve) => {
      healthCheckMiddleware(req, res, () => {
        resolve();
      });
    });

    expect(req.servicesHealth[0]).toMatchObject({
      name: 'Auth Service',
      status: 'unhealthy',
      error: 'Connection refused'
    });
    expect(req.servicesHealth[1].status).toBe('healthy');
    expect(req.servicesHealth[2].status).toBe('healthy');
  });

  it('should handle timeout errors', async () => {
    // Mock timeout - используем AbortSignal
    global.fetch.mockImplementation((url, options) => {
      if (options && options.signal) {
        // Имитируем timeout, вызывая abort
        return new Promise((_, reject) => {
          const handler = () => {
            reject(new Error('The operation was aborted'));
          };
          options.signal.addEventListener('abort', handler);
        });
      }
      return Promise.reject(new Error('Timeout'));
    });

    await new Promise((resolve) => {
      healthCheckMiddleware(req, res, () => {
        resolve();
      });
    });

    req.servicesHealth.forEach(service => {
      expect(service.status).toBe('unhealthy');
    });
  }, 10000); // Устанавливаем таймаут для самого теста

  it('should handle network errors gracefully', async () => {
    global.fetch.mockImplementation(() => {
      return Promise.reject(new Error('Network error'));
    });

    await new Promise((resolve) => {
      healthCheckMiddleware(req, res, () => {
        resolve();
      });
    });

    expect(req.servicesHealth).toBeDefined();
    expect(req.servicesHealth).toHaveLength(3);
    req.servicesHealth.forEach(service => {
      expect(service.status).toBe('unhealthy');
      expect(service.error).toBeDefined();
    });
    expect(next).toHaveBeenCalled();
  });
});
