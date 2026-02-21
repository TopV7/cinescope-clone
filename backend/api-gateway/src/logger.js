import winston from 'winston';

// Настройка логгера с подробным выводом
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
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
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    // Файловый транспорт для всех логов
    new winston.transports.File({
      filename: 'logs/combined.log',
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

// Дополнительные методы для подробного логирования
logger.requestLog = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
};

logger.responseLog = (req, res, next) => {
  const originalSend = res.send;
  res.send = function(data) {
    logger.info(`Outgoing response: ${res.statusCode}`, {
      requestId: req.requestId,
      statusCode: res.statusCode,
      contentType: res.get('Content-Type'),
      contentLength: res.get('Content-Length'),
      responseTime: Date.now() - req.startTime
    });
    originalSend.call(this, data);
  };
  next();
};

export default logger;
