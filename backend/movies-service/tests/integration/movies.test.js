import request from 'supertest';
import app from '../../src/index.js';

describe('Movies Service Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'movies-service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Movies endpoints with authentication', () => {
    // Для тестирования защищенных эндпоинтов нужен токен
    // В реальном сценарии нужно получить токен от auth-service
    const mockToken = 'mock-jwt-token-for-testing';

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle invalid authentication gracefully', async () => {
      const response = await request(app)
        .get('/')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    // Примечание: Для полного тестирования защищенных эндпоинтов
    // требуется интеграция с auth-service для получения валидного токена
    // Это можно добавить в будущем как e2e тесты
  });

  describe('Error handling', () => {
    it('should handle invalid routes', async () => {
      const response = await request(app)
        .get('/invalid-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle unsupported methods', async () => {
      const response = await request(app)
        .patch('/health')
        .expect(404); // или другой код в зависимости от реализации
    });
  });

  describe('CORS and security headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('Request logging', () => {
    it('should include request ID in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
    });
  });
});
