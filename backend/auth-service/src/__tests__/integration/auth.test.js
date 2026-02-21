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

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Сначала зарегистрируем пользователя
      await request(app)
        .post('/auth/register')
        .send({
          email: 'login@test.com',
          password: 'password123',
          name: 'Login Test'
        })
        .expect(201);

      // Затем логинимся
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@test.com',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', 'login@test.com');
      expect(response.body.user).toHaveProperty('name', 'Login Test');
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return error for missing email or password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@test.com'
          // missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });
});
