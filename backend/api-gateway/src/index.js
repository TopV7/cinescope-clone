import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Middleware
import { authProxy, moviesProxy, paymentProxy, healthCheckMiddleware } from './middleware/proxy.js';
import { specs, swaggerMiddleware, swaggerSetup } from './middleware/swagger.js';

// Routes
import gatewayRoutes from './routes/gateway.js';

// Загружаем .env ПЕРЕД всеми импортами
dotenv.config();

// Валидируем переменные окружения
import './validate-env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Отключаем CSP для Swagger UI
}));

app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan('combined'));
app.use(express.json());

// Временно отключаем rate limiting для отладки
// Rate limiting middleware (простая реализация)
// const rateLimit = {};
// app.use((req, res, next) => {
//   try {
//     const key = req.ip;
//     const now = Date.now();
//     const windowMs = 60 * 1000; // 1 минута
//     const maxRequests = 1000; // Увеличенный лимит для gateway

//     if (!rateLimit[key]) {
//       rateLimit[key] = { count: 0, resetTime: now + windowMs };
//     }

//     if (now > rateLimit[key].resetTime) {
//       rateLimit[key] = { count: 0, resetTime: now + windowMs };
//     }

//     rateLimit[key].count++;

//     if (rateLimit[key].count > maxRequests) {
//       console.log(`🚫 Rate limit exceeded for ${key}: ${rateLimit[key].count}/${maxRequests}`);
//       return res.status(429).json({
//         error: 'Too many requests',
//         message: `Rate limit exceeded. Max ${maxRequests} requests per minute.`,
//         retryAfter: Math.ceil((rateLimit[key].resetTime - now) / 1000)
//       });
//     }

//     next();
//   } catch (error) {
//     console.error('❌ Rate limiting error:', error);
//     next();
//   }
// });

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`📝 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// API Routes (BEFORE static files!)
app.use('/api/auth', authProxy);
app.use('/login', authProxy); // Временный роут для совместимости
app.use('/api/movies', moviesProxy);
app.use('/api/payment', paymentProxy);

// Static files (AFTER API routes!)
app.use(express.static(path.join(__dirname, '../../../frontend/dist'), {
  fallthrough: true,
  maxAge: '1d',
  etag: true
}));

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
app.use('/', healthCheckMiddleware, gatewayRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Gateway Error:', err.stack);
  
  // Если это ошибка прокси
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Service unavailable',
      message: 'One or more microservices are unavailable',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({ 
    error: 'Gateway error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: [
      '/health',
      '/api-docs',
      '/api/auth/*',
      '/api/movies/*',
      '/api/payment/*'
    ],
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
