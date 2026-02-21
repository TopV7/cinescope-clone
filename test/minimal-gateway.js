import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = 8081; // Другой порт!

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Логирование
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.originalUrl}`);
  console.log(`🔍 Headers:`, req.headers);
  next();
});

// Прокси для Auth Service
const authProxy = createProxyMiddleware({
  target: 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🚀 Проксируем: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Ответ от Auth Service: ${proxyRes.statusCode}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Ошибка прокси:', err.message);
    if (!res.headersSent) {
      res.status(502).json({
        error: 'Proxy Error',
        message: err.message
      });
    }
  }
});

// Маршруты
app.use('/api/auth', authProxy);
app.use('/health', (req, res) => {
  res.json({ status: 'OK', service: 'minimal-gateway' });
});

// 404 обработчик
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: ['/health', '/api/auth/*']
  });
});

// Запуск
app.listen(PORT, () => {
  console.log(`🚀 Minimal Gateway running on port ${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Auth: http://localhost:${PORT}/api/auth/*`);
});
