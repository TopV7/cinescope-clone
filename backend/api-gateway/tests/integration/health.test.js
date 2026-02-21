import request from 'supertest';
import app from '../../src/index.js';

global.fetch = jest.fn();

describe('Health Endpoint Integration Tests', () => {
  beforeAll(() => {
    global.fetch.mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'OK', service: 'mock-service' }),
        headers: new Map([['x-response-time', '100ms']])
      });
    });
  });

  it('should return health status with 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'OK');
    expect(response.body).toHaveProperty('service', 'api-gateway');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('services');
    expect(Array.isArray(response.body.services)).toBe(true);
  });

  it('should include services health information', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    const services = response.body.services;
    expect(services).toHaveLength(3);

    services.forEach(service => {
      expect(service).toHaveProperty('name');
      expect(service).toHaveProperty('url');
      expect(service).toHaveProperty('status');
      expect(['healthy', 'unhealthy', 'unknown']).toContain(service.status);
    });

    // Check specific service names
    const serviceNames = services.map(s => s.name);
    expect(serviceNames).toContain('Auth Service');
    expect(serviceNames).toContain('Movies Service');
    expect(serviceNames).toContain('Payment Service');
  });

  it('should handle concurrent requests', async () => {
    const promises = Array(5).fill().map(() =>
      request(app).get('/health').expect(200)
    );

    const responses = await Promise.all(promises);

    responses.forEach(response => {
      expect(response.body.status).toBe('OK');
    });
  });

  it('should return correct content type', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200)
      .expect('Content-Type', /json/);
  });

  it('should include request timing', async () => {
    const start = Date.now();
    const response = await request(app).get('/health');
    const end = Date.now();

    expect(response.status).toBe(200);
    // Response should be fast (< 100ms for mock services)
    expect(end - start).toBeLessThan(100);
  });
});
