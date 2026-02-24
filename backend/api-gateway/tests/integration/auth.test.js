import request from 'supertest';
import app from '../../src/index.js';
import { jest } from '@jest/globals';

describe('Auth Integration Tests', () => {
  // Увеличиваем таймаут для всех тестов в этом блоке
  jest.setTimeout(120000);

  let server;

  beforeAll(async () => {
    // Запускаем сервер для тестов
    server = app.listen(0); // случайный порт
    
    // Даем микросервисам время на полную инициализацию
    await new Promise(resolve => setTimeout(resolve, 3000));
  });

  afterAll((done) => {
    // Закрываем сервер после тестов
    if (server) {
      server.close(done);
    } else {
      done();
    }
  });

  it('should login successfully with browser-like headers', async () => {
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
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(typeof response.body.token).toBe('string');
  });

  it('should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cinescope.com', password: 'wrongpassword' })
      .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36')
      .set('Referer', 'http://localhost/login')
      .set('Content-Type', 'application/json')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });
});
