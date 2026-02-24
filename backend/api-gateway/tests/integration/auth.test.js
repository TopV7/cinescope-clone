import request from 'supertest';
import app from '../../src/index.js';
import { jest } from '@jest/globals';
import nock from 'nock';

describe('Auth Integration Tests', () => {
  // Увеличиваем таймаут для всех тестов в этом блоке
  jest.setTimeout(30000);

  const AUTH_SERVICE_URL = 'http://localhost:3001';

  beforeAll(() => {
    // Отключаем реальные HTTP запросы
    nock.disableNetConnect();
  });

  afterEach(() => {
    // Очищаем все мок-запросы после каждого теста
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it('should login successfully with browser-like headers', async () => {
    // Мокируем запрос к auth-service
    nock(AUTH_SERVICE_URL)
      .post('/auth/login', {
        email: 'admin@cinescope.com',
        password: 'admin123'
      })
      .reply(200, {
        token: 'test-jwt-token-here',
        user: {
          id: 1,
          email: 'admin@cinescope.com',
          role: 'admin'
        }
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cinescope.com', password: 'admin123' })
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36')
      .set('Referer', 'http://localhost/login')
      .set('Origin', 'http://localhost')
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .set('sec-ch-ua', '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"')
      .set('sec-ch-ua-mobile', '?0')
      .set('sec-ch-ua-platform', '"Windows"')
      .timeout(10000);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });

  it('should return 401 for invalid credentials', async () => {
    // Мокируем запрос к auth-service с ошибкой
    nock(AUTH_SERVICE_URL)
      .post('/auth/login', {
        email: 'admin@cinescope.com',
        password: 'wrongpassword'
      })
      .reply(401, {
        error: 'Invalid credentials'
      });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cinescope.com', password: 'wrongpassword' })
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36')
      .set('Referer', 'http://localhost/login')
      .set('Content-Type', 'application/json')
      .timeout(10000);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error');
  });
});
