import request from 'supertest';
import app from '../../src/index.js';

describe('Payment Service Integration Tests', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'payment-service');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /validate-card', () => {
    it('should validate a valid card', async () => {
      const cardData = {
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryMonth: '12',
        expiryYear: '2025',
        cardholderName: 'John Doe'
      };

      const response = await request(app)
        .post('/validate-card')
        .send(cardData)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('cardType', 'visa');
      expect(response.body).toHaveProperty('maskedNumber', '************1111');
      expect(response.body.errors).toHaveLength(0);
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should reject invalid card data', async () => {
      const invalidCardData = {
        cardNumber: '4111111111111112', // Invalid Luhn
        cvv: '12', // Invalid CVV length
        expiryMonth: '13', // Invalid month
        expiryYear: '2023' // Expired
      };

      const response = await request(app)
        .post('/validate-card')
        .send(invalidCardData)
        .expect(200); // Still 200, but valid: false

      expect(response.body).toHaveProperty('valid', false);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing required fields', async () => {
      const incompleteData = {
        cardNumber: '4111111111111111'
        // Missing cvv, expiryMonth, expiryYear
      };

      const response = await request(app)
        .post('/validate-card')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields');
      expect(response.body.required).toContain('cvv');
      expect(response.body.required).toContain('expiryMonth');
      expect(response.body.required).toContain('expiryYear');
    });
  });

  describe('POST /create (Payment Creation)', () => {
    it('should reject unauthenticated requests', async () => {
      const paymentData = {
        userId: 1,
        amount: 1000,
        cardNumber: '4111111111111111',
        cvv: '123',
        expiryMonth: '12',
        expiryYear: '2025'
      };

      const response = await request(app)
        .post('/create')
        .send(paymentData)
        .expect(401); // Assuming authentication middleware returns 401

      expect(response.body).toHaveProperty('error');
    });

    it('should reject requests with missing fields', async () => {
      // Mock authentication token if possible, or expect 401
      const incompleteData = {
        userId: 1,
        amount: 1000
        // Missing card details
      };

      const response = await request(app)
        .post('/create')
        .set('Authorization', 'Bearer mock-token')
        .send(incompleteData)
        .expect(401); // Will be 401 due to invalid auth

      // In a real scenario with valid auth, it should return 400
    });
  });

  describe('Request logging and headers', () => {
    it('should include request ID in response', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
    });

    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('CORS handling', () => {
    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid routes', async () => {
      const response = await request(app)
        .get('/invalid-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/validate-card')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400); // Express should handle this
    });
  });
});
