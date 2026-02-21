import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

// Logger
import logger from './logger.js';

// Загружаем .env ПЕРЕД всеми импортами
dotenv.config();

logger.info('Environment variables loaded for auth-service', { nodeEnv: process.env.NODE_ENV, port: process.env.PORT, jwtSecretSet: !!process.env.JWT_SECRET });

import './database.js'; // Инициализация базы данных

// Middleware для внутреннего JWT
import { authenticateInternal } from './middleware/internalAuth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// JSON parser ДО логирования
app.use(express.json());

// Детальный логгер с Request-ID
app.use((req, res, next) => {
  const start = Date.now();
  
  // Получаем Request-ID от Gateway
  const requestId = req.headers['x-request-id'] || `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Логируем детали запроса
  console.log(`🔐 === AUTH SERVICE ЗАПРОС ===`);
  console.log(`🔐 Request-ID: ${requestId}`);
  console.log(`🔐 Метод: ${req.method}`);
  console.log(`🔐 URL: ${req.originalUrl}`);
  console.log(`🔐 Заголовки:`, req.headers);
  console.log(`🔐 Content-Type: ${req.headers['content-type'] || 'не указан'}`);
  console.log(`🔐 Content-Length: ${req.headers['content-length'] || 'не указан'}`);
  console.log(`🔐 User-Agent: ${req.headers['user-agent'] || 'не указан'}`);
  
  // Передаем Request-ID в ответ
  res.setHeader('x-request-id', requestId);
  
  // Для POST/PUT запросов логируем тело
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`🔐 Тело запроса:`, JSON.stringify(req.body, null, 2));
    
    // Маскируем чувствительные данные
    if (req.body && req.body.password) {
      const maskedBody = { ...req.body, password: '***MASKED***' };
      console.log(`🔐 Тело (маскированное):`, JSON.stringify(maskedBody, null, 2));
    }
  }
  
  // Логируем ответ
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`🔐 === AUTH SERVICE ЗАВЕРШЕНО ===`);
    console.log(`🔐 Request-ID: ${requestId}`);
    console.log(`🔐 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    console.log(`🔐 Content-Type ответа: ${res.getHeader('content-type') || 'не указан'}`);
    console.log(`🔐 Content-Length ответа: ${res.getHeader('content-length') || 'не указан'}`);
    console.log(`🔐 =========================\n`);
  });
  
  next();
});

// Middleware для проверки внутреннего JWT
app.use(authenticateInternal);

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/auth', authRoutes);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
});

export default app;
