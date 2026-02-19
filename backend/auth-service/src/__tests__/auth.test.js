import request from 'supertest';
import app from '../index.js';

// Тесты для Auth Service
describe('Auth Service', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User'
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body).toHaveProperty('userId');
    });

    it('should return error for existing email', async () => {
      // Сначала зарегистрируем пользователя
      await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'password123',
          name: 'Test User'
        });

      // Попробуем зарегистрировать снова
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'password123',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'User already exists');
    });

    it('should return error for missing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          password: 'password123'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'auth-service');
    });
  });
});
