// Jest Setup для всех тестов
process.env.NODE_ENV = 'test';
process.env.INTERNAL_JWT_SECRET = 'test-secret-key';
process.env.AUTH_SERVICE_URL = 'http://localhost:3001';
process.env.MOVIES_SERVICE_URL = 'http://localhost:3002';
process.env.PAYMENT_SERVICE_URL = 'http://localhost:3003';

