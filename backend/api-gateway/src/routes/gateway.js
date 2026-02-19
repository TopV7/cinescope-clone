import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Gateway
 *   description: API Gateway operations
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Gateway]
 *     summary: Get API Gateway health status
 *     description: Returns the health status of the API Gateway and all microservices
 *     responses:
 *       200:
 *         description: Gateway and services are healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 service:
 *                   type: string
 *                   example: api-gateway
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       url:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [healthy, unhealthy, unknown]
 *       503:
 *         description: One or more services are unhealthy
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    services: req.servicesHealth || []
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     tags: [Gateway]
 *     summary: Get API Gateway information
 *     description: Returns information about the API Gateway and available services
 *     responses:
 *       200:
 *         description: Gateway information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 🚪 CineScope API Gateway
 *                 version:
 *                   type: string
 *                   example: 1.0.0
 *                 description:
 *                   type: string
 *                   example: Central gateway for all CineScope microservices
 *                 services:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       endpoint:
 *                         type: string
 *                       description:
 *                         type: string
 *                 documentation:
 *                   type: string
 *                   example: /api-docs
 */
router.get('/', (req, res) => {
  res.json({
    message: '🚪 CineScope API Gateway',
    version: '1.0.0',
    description: 'Central gateway for all CineScope microservices',
    services: [
      {
        name: 'Authentication Service',
        endpoint: '/api/auth/*',
        description: 'User authentication and authorization'
      },
      {
        name: 'Movies Service',
        endpoint: '/api/movies/*',
        description: 'Movie catalog and search'
      },
      {
        name: 'Payment Service',
        endpoint: '/api/payment/*',
        description: 'Payment processing and validation'
      }
    ],
    documentation: '/api-docs',
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /services:
 *   get:
 *     tags: [Gateway]
 *     summary: Get available services status
 *     description: Returns the status of all available microservices
 *     responses:
 *       200:
 *         description: Services status
 */
router.get('/services', (req, res) => {
  res.json({
    services: req.servicesHealth || [],
    total: req.servicesHealth ? req.servicesHealth.length : 0,
    healthy: req.servicesHealth ? req.servicesHealth.filter(s => s.status === 'healthy').length : 0,
    unhealthy: req.servicesHealth ? req.servicesHealth.filter(s => s.status === 'unhealthy').length : 0,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /routes:
 *   get:
 *     tags: [Gateway]
 *     summary: Get all available routes
 *     description: Returns all available routes through the gateway
 *     responses:
 *       200:
 *         description: Available routes
 */
router.get('/routes', (req, res) => {
  res.json({
    routes: [
      {
        method: 'GET',
        path: '/',
        description: 'Gateway information'
      },
      {
        method: 'GET',
        path: '/health',
        description: 'Health check'
      },
      {
        method: 'GET',
        path: '/services',
        description: 'Services status'
      },
      {
        method: 'GET',
        path: '/routes',
        description: 'Available routes'
      },
      {
        method: 'GET',
        path: '/api-docs',
        description: 'Swagger documentation'
      },
      {
        method: 'ALL',
        path: '/api/auth/*',
        description: 'Authentication Service'
      },
      {
        method: 'ALL',
        path: '/api/movies/*',
        description: 'Movies Service'
      },
      {
        method: 'ALL',
        path: '/api/payment/*',
        description: 'Payment Service'
      }
    ],
    timestamp: new Date().toISOString()
  });
});

// Обработка статических файлов фронтенда (если собраны)
router.use(express.static(path.join(__dirname, '../../../frontend/dist'), {
  fallthrough: true, // Если файл не найден, продолжаем обработку
  maxAge: '1d', // Кеширование на 1 день
  etag: true
}));

// Fallback для React Router (SPA)
router.use((req, res, next) => {
  // Если запрос начинается с /api/ или /login, это API запрос
  if (req.path.startsWith('/api/') || req.path.startsWith('/login')) {
    return next();
  }
  
  // Для всех остальных запросов отдаем index.html
  const indexPath = path.join(__dirname, '../../../frontend/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).json({
        error: 'Frontend not available',
        message: 'Frontend build not found. Please build the frontend application.'
      });
    }
  });
});

export default router;
