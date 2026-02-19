import { createProxyMiddleware } from 'http-proxy-middleware';

// Конфигурация прокси для микросервисов
export const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
  pathRewrite: {
    '^/api/auth': '/auth', // /api/auth/login -> /auth/login
  },
  onError: (err, req, res) => {
    console.error('Auth Service Proxy Error:', err.message);
    console.error('Full error:', err);
    if (!res.headersSent) {
      if (err.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'Auth Service unavailable',
          message: 'Authentication service is not running or not reachable'
        });
      } else if (err.code === 'ETIMEDOUT') {
        res.status(504).json({
          error: 'Auth Service timeout',
          message: 'Authentication service took too long to respond'
        });
      } else {
        res.status(502).json({
          error: 'Auth Service error',
          message: 'Authentication service encountered an error'
        });
      }
    }
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to Auth Service: ${req.method} ${req.url}`);

    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Auth Service Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  },
  onProxyReqWs: (proxyReq, req, socket, options, head) => {
    console.log('🔄 Proxying WebSocket to Auth Service');
  }
});

export const moviesProxy = createProxyMiddleware({
  target: process.env.MOVIES_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
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
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Movies Service Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  }
});

export const paymentProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  timeout: 30000,
  proxyTimeout: 30000,
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
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Payment Service Response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  }
});

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
        const response = await fetch(`${service.url}/health`, { timeout: 5000 });
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
