import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import moviesRoutes from './routes/movies.js';

// Logger
import logger from './logger.js';

// Загружаем .env ПЕРЕД всеми импортами
dotenv.config();

logger.info('Environment variables loaded for movies-service', { nodeEnv: process.env.NODE_ENV, port: process.env.PORT });

import './database.js'; // Инициализация базы данных

// Middleware для внутреннего JWT
import { authenticateInternal } from './middleware/internalAuth.js';

const app = express();
const PORT = process.env.PORT || 3002;

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
  const requestId = req.headers['x-request-id'] || `movies-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Логируем детали запроса
  console.log(`🎬 === MOVIES SERVICE ЗАПРОС ===`);
  console.log(`🎬 Request-ID: ${requestId}`);
  console.log(`🎬 Метод: ${req.method}`);
  console.log(`🎬 URL: ${req.originalUrl}`);
  console.log(`🎬 Заголовки:`, req.headers);
  console.log(`🎬 Content-Type: ${req.headers['content-type'] || 'не указан'}`);
  console.log(`🎬 Content-Length: ${req.headers['content-length'] || 'не указан'}`);
  console.log(`🎬 User-Agent: ${req.headers['user-agent'] || 'не указан'}`);
  
  // Передаем Request-ID в ответ
  res.setHeader('x-request-id', requestId);
  
  // Для POST/PUT запросов логируем тело
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`🎬 Тело запроса:`, JSON.stringify(req.body, null, 2));
  }
  
  // Логируем ответ
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`🎬 === MOVIES SERVICE ЗАВЕРШЕНО ===`);
    console.log(`🎬 Request-ID: ${requestId}`);
    console.log(`🎬 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    console.log(`🎬 Content-Type ответа: ${res.getHeader('content-type') || 'не указан'}`);
    console.log(`🎬 Content-Length ответа: ${res.getHeader('content-length') || 'не указан'}`);
    console.log(`🎬 =========================\n`);
  });
  
  next();
});

// Middleware для проверки внутреннего JWT
app.use(authenticateInternal);

// Health check (ДО routes!)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'movies-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/', moviesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Movies Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      movies: '/movies',
      movieById: '/movies/:id',
      search: '/movies/search/query?q=...',
      genres: '/movies/genres/list',
      popular: '/movies/popular'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Movies Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎥 Movies API: http://localhost:${PORT}/movies`);
  console.log(`🔍 Search: http://localhost:${PORT}/movies/search/query?q=inception`);
});

export default app;
