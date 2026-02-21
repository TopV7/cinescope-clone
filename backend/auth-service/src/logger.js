import winston from 'winston';

// Настройка логгера с подробным выводом для auth-service
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'auth-service' },
  transports: [
    // Консольный транспорт для подробного логирования
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const requestId = meta.requestId ? ` [${meta.requestId}]` : '';
          const service = meta.service ? ` [${meta.service}]` : '';
          return `${timestamp} ${level}${requestId}${service}: ${message}`;
        })
      )
    }),
    // Файловый транспорт для ошибок
    new winston.transports.File({
      filename: 'logs/auth-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    // Файловый транспорт для всех логов
    new winston.transports.File({
      filename: 'logs/auth-combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    })
  ]
});

// Если не в продакшене, логируем в консоль с цветами
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Дополнительные методы для подробного логирования аутентификации
logger.authLog = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  logger.info(`Authentication request: ${req.method} ${req.originalUrl}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.method === 'POST' || req.method === 'PUT' ? maskSensitiveData(req.body) : undefined
  });
  next();
};

logger.tokenLog = (userId, action) => {
  logger.info(`Token ${action}`, {
    userId,
    action,
    timestamp: new Date().toISOString()
  });
};

logger.rateLimitLog = (key, count, maxRequests) => {
  logger.warn(`Rate limit exceeded`, {
    key,
    currentCount: count,
    maxRequests,
    timestamp: new Date().toISOString()
  });
};

logger.registrationLog = (email, userId) => {
  logger.info(`User registration`, {
    email: maskEmail(email),
    userId,
    timestamp: new Date().toISOString()
  });
};

logger.loginLog = (email, success) => {
  logger.info(`User login attempt`, {
    email: maskEmail(email),
    success,
    timestamp: new Date().toISOString()
  });
};

// Функции для маскировки чувствительных данных
function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  const masked = { ...data };
  if (masked.password) masked.password = '***MASKED***';
  if (masked.token) masked.token = '***MASKED***';
  if (masked.refreshToken) masked.refreshToken = '***MASKED***';
  return masked;
}

function maskEmail(email) {
  if (!email) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export default logger;
