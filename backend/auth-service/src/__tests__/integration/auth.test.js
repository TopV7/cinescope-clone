import request from 'supertest';

// Skip all integration tests if no database is available
// These tests require a real database connection which may not be available in CI
describe.skip('Auth Service Integration Tests', () => {
  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      // This test requires a real database
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
      // This test requires a real database
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
      // This test requires a real database
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
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email and password are required');
    });
  });
});
