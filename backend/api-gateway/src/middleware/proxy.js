import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

// Health check middleware
export const healthCheckMiddleware = async (req, res, next) => {
  const services = [
    { name: 'Auth Service', url: process.env.AUTH_SERVICE_URL },
    { name: 'Movies Service', url: process.env.MOVIES_SERVICE_URL },
    { name: 'Payment Service', url: process.env.PAYMENT_SERVICE_URL }
  ];
  
  req.servicesHealth = [];
  
  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${service.url}/health`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      req.servicesHealth.push({
        name: service.name,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: response.headers.get('x-response-time') || 'N/A'
      });
    } catch (error) {
      req.servicesHealth.push({
        name: service.name,
        status: 'unhealthy',
        error: error.message
      });
    }
  }
  
  next();
};

// Auth Service Proxy
export const authProxy = createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: {
    '^/': '/auth/',
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      const requestId = req.headers['x-request-id'] || 'unknown';
      console.log(`🚀 === AUTH PROXY REQUEST ===`);
      console.log(`🚀 Request-ID: ${requestId}`);
      console.log(`🚀 Проксируем: ${req.method} ${req.originalUrl} -> ${proxyReq.path}`);
      
      const internalToken = jwt.sign({ service: 'api-gateway' }, process.env.INTERNAL_JWT_SECRET);
      proxyReq.setHeader('X-Internal-Auth', internalToken);
      
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        console.log(`🚀 Request body:`, bodyData);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
      
      console.log(`🚀 =========================\n`);
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`🎯 AUTH PROXY RESPONSE: ${proxyRes.statusCode}`);
    },
    error: (err, req, res) => {
      console.error(`❌ AUTH PROXY ERROR:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Auth Service error', message: err.message });
      }
    }
  }
});

// Movies Service Proxy
export const moviesProxy = createProxyMiddleware({
  target: process.env.MOVIES_SERVICE_URL || 'http://localhost:3002',
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: {
    '^/': '/movies/',
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`🔄 Movies Proxy: ${req.method} ${req.url} -> ${proxyReq.path}`);
      const internalToken = jwt.sign({ service: 'api-gateway' }, process.env.INTERNAL_JWT_SECRET);
      proxyReq.setHeader('X-Internal-Auth', internalToken);
      
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`✅ Movies Response: ${proxyRes.statusCode}`);
    },
    error: (err, req, res) => {
      console.error('Movies Proxy Error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Movies Service error', message: err.message });
      }
    }
  }
});

// Payment Service Proxy
export const paymentProxy = createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
  changeOrigin: true,
  timeout: 60000,
  proxyTimeout: 60000,
  pathRewrite: {
    '^/': '/payment/',
  },
  on: {
    proxyReq: (proxyReq, req, res) => {
      console.log(`💰 Payment Proxy: ${req.method} ${req.url} -> ${proxyReq.path}`);
      const internalToken = jwt.sign({ service: 'api-gateway' }, process.env.INTERNAL_JWT_SECRET);
      proxyReq.setHeader('X-Internal-Auth', internalToken);
      
      if (req.body && Object.keys(req.body).length > 0) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    proxyRes: (proxyRes, req, res) => {
      console.log(`✅ Payment Response: ${proxyRes.statusCode}`);
    },
    error: (err, req, res) => {
      console.error('Payment Proxy Error:', err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Payment Service error', message: err.message });
      }
    }
  }
});