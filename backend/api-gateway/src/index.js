import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Logger
import logger from './logger.js';

// Middleware
import { authProxy, moviesProxy, paymentProxy, healthCheckMiddleware } from './middleware/proxy.js';
import { specs, swaggerMiddleware, swaggerSetup } from './middleware/swagger.js';

// Routes
import gatewayRoutes from './routes/gateway.js';

// Загружаем .env ПЕРЕД всеми импортами
dotenv.config();

logger.info('Environment variables loaded', { nodeEnv: process.env.NODE_ENV, port: process.env.PORT });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
// app.use(helmet({
//   contentSecurityPolicy: false, // Отключаем CSP для Swagger UI
// }));

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: false, // Временно отключаем для отладки
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));

// Детальный логгер для отладки проксирования
app.use((req, res, next) => {
  const start = Date.now();
  
  // Получаем или генерируем request_id
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Логируем детали запроса
  console.log(`🔍 === НОВЫЙ ЗАПРОС ===`);
  console.log(`🔍 Request-ID: ${requestId}`);
  console.log(`🔍 Метод: ${req.method}`);
  console.log(`🔍 URL: ${req.originalUrl}`);
  console.log(`🔍 Заголовки:`, req.headers);
  console.log(`🔍 Content-Type: ${req.headers['content-type'] || 'не указан'}`);
  console.log(`🔍 Content-Length: ${req.headers['content-length'] || 'не указан'}`);
  console.log(`🔍 User-Agent: ${req.headers['user-agent'] || 'не указан'}`);
  
  // Передаем request_id дальше в заголовках
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  
  // Для POST/PUT запросов логируем тело
  if (req.method === 'POST' || req.method === 'PUT') {
    let bodyData = [];
    let bodyLength = 0;
    
    req.on('data', chunk => {
      bodyData.push(chunk);
      bodyLength += chunk.length;
      console.log(`🔍 Получен chunk: ${chunk.length} байт, всего: ${bodyLength} байт`);
    });
    
    req.on('end', () => {
      const fullBody = Buffer.concat(bodyData);
      console.log(`🔍 Полное тело запроса: ${fullBody.length} байт`);
      
      // Пытаемся распарсить JSON для логирования
      if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
        try {
          const jsonData = JSON.parse(fullBody.toString('utf8'));
          console.log(`🔍 JSON тело:`, JSON.stringify(jsonData, null, 2));
          
          // Маскируем чувствительные данные
          if (jsonData.password) {
            jsonData.password = '***MASKED***';
          }
          if (jsonData.token) {
            jsonData.token = '***MASKED***';
          }
          console.log(`🔍 Тело (маскированное):`, JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log(`🔍 Тело (не JSON):`, fullBody.toString('utf8'));
        }
      } else {
        console.log(`🔍 Тело (raw):`, fullBody.toString('utf8'));
      }
      
      console.log(`🔍 === ОТПРАВЛЯЕМ В ПРОКСИ ===`);
    });
  } else {
    console.log(`🔍 === ОТПРАВЛЯЕМ В ПРОКСИ (GET/DELETE) ===`);
  }
  
  // Логируем ответ
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📝 === ЗАВЕРШЕНО ===`);
    console.log(`📝 Request-ID: ${requestId}`);
    console.log(`📝 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    console.log(`📝 Content-Type ответа: ${res.getHeader('content-type') || 'не указан'}`);
    console.log(`📝 Content-Length ответа: ${res.getHeader('content-length') || 'не указан'}`);
    console.log(`📝 =========================\n`);
  });
  
  next();
});

// СНАЧАЛА проксируем запросы (БЕЗ body parser!)
app.use('/api/auth', authProxy);
// app.use('/login', authProxy); // Отключаем - конфликтует с /api/auth
app.use('/api/movies', moviesProxy);
app.use('/api/payment', paymentProxy);

// Static files (AFTER API routes!)
app.use(express.static(path.join(__dirname, '../../../frontend/dist'), {
  fallthrough: false, // Отключаем, чтобы не перехватывать API запросы
  maxAge: '1d',
  etag: true
}));

// Body parser только для собственных маршрутов Gateway (В САМОМ КОНЦЕ!)
app.use(express.json({ limit: '10mb' }));

// Gateway routes (API only)
app.use('/health', healthCheckMiddleware, (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    services: req.servicesHealth || []
  });
});

// Swagger documentation (если включен)
if (process.env.SWAGGER_ENABLED !== 'false') {
  app.use('/api-docs', swaggerMiddleware, swaggerSetup);
  console.log(`📚 Swagger documentation: http://localhost:${PORT}/api-docs`);
}

// Gateway API routes (AFTER API routes!)
// app.use('/', healthCheckMiddleware, gatewayRoutes); // ОТКЛЮЧАЕМ!

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err.stack);
  
  const requestId = req.headers['x-request-id'] || 'unknown';
  console.error(`❌ Request-ID: ${requestId}`);
  console.error(`❌ Error:`, err.message);
  
  // Если это ошибка прокси
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'API Gateway encountered an error',
        requestId: requestId
      });
    }
  }
});

// POST запросы перед fallback
app.use((req, res, next) => {
  if (req.method === 'POST') {
    res.status(405).json({
      error: 'Method Not Allowed',
      message: 'POST requests are not allowed here',
      requestId: req.headers['x-request-id'] || 'unknown'
    });
  } else {
    next();
  }
});

// 404 handler (ДОЛЖЕН БЫТЬ ПОСЛЕ ВСЕХ МАРШРУТОВ!)
app.use((req, res) => {
  const requestId = req.headers['x-request-id'] || 'unknown';
  console.log(`❌ 404 - Request-ID: ${requestId}`);
  console.log(`❌ 404 - Method: ${req.method}`);
  console.log(`❌ 404 - URL: ${req.originalUrl}`);
  
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: ['/health', '/api-docs', '/api/auth/*', '/api/movies/*', '/api/payment/*'],
    requestId: requestId,
    timestamp: new Date().toISOString()
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
  console.log(`🚪 API Gateway running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 Auth Service: http://localhost:${PORT}/api/auth/*`);
  console.log(`🎬 Movies Service: http://localhost:${PORT}/api/movies/*`);
  console.log(`💳 Payment Service: http://localhost:${PORT}/api/payment/*`);
  console.log(`⏱️  Uptime: ${process.uptime()}s`);
  
  // Проверяем доступность микросервисов
  setTimeout(async () => {
    try {
      const healthResponse = await fetch(`http://localhost:${PORT}/health`);
      const healthData = await healthResponse.json();
      
      console.log('\n📊 Services Status:');
      healthData.services.forEach(service => {
        const status = service.status === 'healthy' ? '✅' : '❌';
        console.log(`  ${status} ${service.name}: ${service.status}`);
      });
    } catch (error) {
      console.log('⚠️  Could not check services health');
    }
  }, 2000);
});

export default app;
