import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

// Функция для создания retry middleware
const createRetryMiddleware = (originalMiddleware, maxRetries = 3) => {
  return (req, res, next) => {
    let attempts = 0;
    
    const tryRequest = () => {
      attempts++;
      const nextProxy = () => {
        originalMiddleware(req, res, (err) => {
          if (err && attempts < maxRetries && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
            console.log(`⚠️  Retry attempt ${attempts}/${maxRetries} for ${req.method} ${req.url}`);
            // Добавляем задержку перед повторной попыткой
            setTimeout(tryRequest, 1000);
          } else {
            next(err);
          }
        });
      };
      nextProxy();
    };
    
    tryRequest();
  };
};

// Конфигурация прокси для микросервисов
const authProxyBase = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: {
    '^/api': '', // /api/auth/login -> /auth/login
  },
  onProxyReq: (proxyReq, req, res) => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    console.log(`🚀 === AUTH PROXY REQUEST ===`);
    console.log(`🚀 Request-ID: ${requestId}`);
    console.log(`🚀 Проксируем: ${req.method} ${req.originalUrl} -> ${proxyReq.method} ${proxyReq.path}`);
    console.log(`🚀 Target: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
    console.log(`🚀 Headers to Auth Service:`, proxyReq.getHeaders());
    
    // Если есть тело запроса, логируем его
    if (req.body) {
      console.log(`🚀 Request body to Auth Service:`, JSON.stringify(req.body, null, 2));
    }
    console.log(`🚀 =========================\n`);
  },
  onProxyRes: (proxyRes, req, res) => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    console.log(`🎯 === AUTH PROXY RESPONSE ===`);
    console.log(`🎯 Request-ID: ${requestId}`);
    console.log(`🎯 Статус: ${proxyRes.statusCode}`);
    console.log(`🎯 Headers from Auth Service:`, proxyRes.headers);
    console.log(`🎯 =========================\n`);
  },
  onError: (err, req, res) => {
    const requestId = req.headers['x-request-id'] || 'unknown';
    console.error(`❌ === AUTH PROXY ERROR ===`);
    console.error(`❌ Request-ID: ${requestId}`);
    console.error(`❌ Error:`, err.message);
    console.error(`❌ Error Code:`, err.code);
    console.error(`❌ Error Errno:`, err.errno);
    console.error(`❌ Full error:`, err);
    console.error(`❌ Target: ${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}`);
    if (!res.headersSent) {
      if (err.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Auth Service unavailable',
          message: 'Authentication service is not running or not reachable',
          requestId: requestId,
          target: process.env.AUTH_SERVICE_URL
        });
      } else if (err.code === 'ETIMEDOUT') {
        res.status(504).json({
          error: 'Auth Service timeout',
          message: 'Authentication service request timed out',
          requestId: requestId
        });
      } else {
        res.status(502).json({
          error: 'Auth Service error',
          message: 'Authentication service error',
          requestId: requestId,
          errorCode: err.code
        });
      }
    }
  }
});

export const authProxy = createRetryMiddleware(authProxyBase);

const moviesProxyBase = createProxyMiddleware({
  target: process.env.MOVIES_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: {
    '^/api/movies': '/', // Отрезаем всё и оставляем только корень
  },
  onError: (err, req, res) => {
    console.error('Movies Service Proxy Error:', err.message);
    if (!res.headersSent) {
      if (err.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Movies Service unavailable',
          message: 'Movies service is not running or not reachable'
        });
      } else if (err.code === 'ETIMEDOUT') {
        res.status(504).json({
          error: 'Movies Service timeout',
          message: 'Movies service took too long to respond'
        });
      } else {
        res.status(502).json({
          error: 'Movies Service error',
          message: 'Movies service encountered an error'
        });
      }
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to Movies Service: ${req.method} ${req.url}`);

    // Добавляем внутренний JWT для межсервисной аутентификации
    const internalToken = jwt.sign({ service: 'api-gateway' }, process.env.INTERNAL_JWT_SECRET);
    proxyReq.setHeader('X-Internal-Auth', internalToken);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Movies Service Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  }
});

export const moviesProxy = createRetryMiddleware(moviesProxyBase);

const paymentProxyBase = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: {
    '^/api/payment': '/payment', // /api/payment/process -> /payment/process
  },
  onError: (err, req, res) => {
    console.error('Payment Service Proxy Error:', err.message);
    if (!res.headersSent) {
      if (err.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Payment Service unavailable',
          message: 'Payment service is not running or not reachable'
        });
      } else if (err.code === 'ETIMEDOUT') {
        res.status(504).json({
          error: 'Payment Service timeout',
          message: 'Payment service took too long to respond'
        });
      } else {
        res.status(502).json({
          error: 'Payment Service error',
          message: 'Payment service encountered an error'
        });
      }
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to Payment Service: ${req.method} ${req.url}`);

    // Добавляем внутренний JWT для межсервисной аутентификации
    const internalToken = jwt.sign({ service: 'api-gateway' }, process.env.INTERNAL_JWT_SECRET);
    proxyReq.setHeader('X-Internal-Auth', internalToken);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Payment Service Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  }
});

export const paymentProxy = createRetryMiddleware(paymentProxyBase);

// Middleware для проверки здоровья микросервисов
export const healthCheckMiddleware = (req, res, next) => {
  const services = [
    { name: 'Auth Service', url: process.env.AUTH_SERVICE_URL || 'http://localhost:3001' },
    { name: 'Movies Service', url: process.env.MOVIES_SERVICE_URL || 'http://localhost:3002' },
    { name: 'Payment Service', url: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003' }
  ];

  Promise.all(
    services.map(async (service) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${service.url}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        return {
          name: service.name,
          url: service.url,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime: response.headers.get('x-response-time') || 'unknown'
        };
      } catch (error) {
        return {
          name: service.name,
          url: service.url,
          status: 'unhealthy',
          error: error.message
        };
      }
    })
  ).then(healthResults => {
    req.servicesHealth = healthResults;
    next();
  }).catch(error => {
    console.error('Health check error:', error);
    req.servicesHealth = services.map(service => ({
      name: service.name,
      url: service.url,
      status: 'unknown',
      error: 'Health check failed'
    }));
    next();
  });
};
