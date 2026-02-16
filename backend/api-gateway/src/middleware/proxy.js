import { createProxyMiddleware } from 'http-proxy-middleware';

// Конфигурация прокси для микросервисов
export const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '', // Убираем /api/auth при проксировании
  },
  onError: (err, req, res) => {
    console.error('Auth Service Proxy Error:', err.message);
    res.status(503).json({
      error: 'Auth Service unavailable',
      message: 'Authentication service is temporarily unavailable'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to Auth Service: ${req.method} ${req.url}`);
  }
});

export const moviesProxy = createProxyMiddleware({
  target: process.env.MOVIES_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/api/movies': '', // Убираем /api/movies при проксировании
  },
  onError: (err, req, res) => {
    console.error('Movies Service Proxy Error:', err.message);
    res.status(503).json({
      error: 'Movies Service unavailable',
      message: 'Movies service is temporarily unavailable'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to Movies Service: ${req.method} ${req.url}`);
  }
});

export const paymentProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/api/payment': '', // Убираем /api/payment при проксировании
  },
  onError: (err, req, res) => {
    console.error('Payment Service Proxy Error:', err.message);
    res.status(503).json({
      error: 'Payment Service unavailable',
      message: 'Payment service is temporarily unavailable'
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying to Payment Service: ${req.method} ${req.url}`);
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
