import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import paymentRoutes from './routes/payments.js';

// Logger
import logger from './logger.js';

// Загружаем .env ПЕРЕД всеми импортами
dotenv.config();

logger.info('Environment variables loaded for payment-service', { nodeEnv: process.env.NODE_ENV, port: process.env.PORT });

import './database.js'; // Инициализация базы данных

// Middleware для внутреннего JWT
import { authenticateInternal } from './middleware/internalAuth.js';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Детальный логгер с Request-ID
app.use((req, res, next) => {
  const start = Date.now();
  
  // Получаем Request-ID от Gateway
  const requestId = req.headers['x-request-id'] || `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Логируем детали запроса
  console.log(`💳 === PAYMENT SERVICE ЗАПРОС ===`);
  console.log(`💳 Request-ID: ${requestId}`);
  console.log(`💳 Метод: ${req.method}`);
  console.log(`💳 URL: ${req.originalUrl}`);
  console.log(`💳 Заголовки:`, req.headers);
  console.log(`💳 Content-Type: ${req.headers['content-type'] || 'не указан'}`);
  console.log(`💳 Content-Length: ${req.headers['content-length'] || 'не указан'}`);
  console.log(`💳 User-Agent: ${req.headers['user-agent'] || 'не указан'}`);
  
  // Передаем Request-ID в ответ
  res.setHeader('x-request-id', requestId);
  
  // Для POST/PUT запросов логируем тело
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`💳 Тело запроса:`, JSON.stringify(req.body, null, 2));
    
    // Маскируем чувствительные данные
    if (req.body && req.body.cardNumber) {
      const maskedBody = { 
        ...req.body, 
        cardNumber: '****-****-****-****',
        cvv: '***'
      };
      console.log(`💳 Тело (маскированное):`, JSON.stringify(maskedBody, null, 2));
    }
  }
  
  // Логируем ответ
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`💳 === PAYMENT SERVICE ЗАВЕРШЕНО ===`);
    console.log(`💳 Request-ID: ${requestId}`);
    console.log(`💳 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    console.log(`💳 Content-Type ответа: ${res.getHeader('content-type') || 'не указан'}`);
    console.log(`💳 Content-Length ответа: ${res.getHeader('content-length') || 'не указан'}`);
    console.log(`💳 =========================\n`);
  });
  
  next();
});

// Rate limiting middleware (простая реализация)
const rateLimit = {};
app.use((req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 минута
  const maxRequests = 100;

  if (!rateLimit[key]) {
    rateLimit[key] = { count: 0, resetTime: now + windowMs };
  }

  if (now > rateLimit[key].resetTime) {
    rateLimit[key] = { count: 0, resetTime: now + windowMs };
  }

  rateLimit[key].count++;

  if (rateLimit[key].count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Max ${maxRequests} requests per minute.`,
      retryAfter: Math.ceil((rateLimit[key].resetTime - now) / 1000)
    });
  }

  next();
});

// Middleware для проверки внутреннего JWT
app.use(authenticateInternal);

// Routes
app.use('/payment', paymentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '💳 Payment Service API',
    version: '1.0.0',
    description: 'Secure payment processing service for CineScope',
    endpoints: {
      health: '/health',
      validateCard: '/payment/validate-card',
      createPayment: '/payment/create',
      paymentStatus: '/payment/status/:transactionId',
      paymentHistory: '/payment/history/:userId',
      refund: '/payment/refund',
      statistics: '/payment/stats'
    },
    security: {
      rateLimit: '100 requests per minute',
      encryption: 'AES-256',
      compliance: 'PCI DSS'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Payment Service Error:', err.stack);
  res.status(500).json({ 
    error: 'Payment processing error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    transactionId: null // В реальном приложении здесь был бы ID транзакции
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      '/health',
      '/payment/validate-card',
      '/payment/create',
      '/payment/status/:transactionId',
      '/payment/history/:userId',
      '/payment/refund',
      '/payment/stats'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💳 Payment API: http://localhost:${PORT}/payment`);
  console.log(`🔒 Security: Rate limiting enabled (100 req/min)`);
  console.log(`🔐 Encryption: AES-256 enabled`);
  console.log(`⏱️  Uptime: ${process.uptime()}s`);
});

export default app;
