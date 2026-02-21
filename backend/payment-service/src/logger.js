import winston from 'winston';

// Настройка логгера с подробным выводом для payment-service
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'payment-service' },
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
      filename: 'logs/payment-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    // Файловый транспорт для всех логов
    new winston.transports.File({
      filename: 'logs/payment-combined.log',
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

// Дополнительные методы для подробного логирования платежей
logger.paymentLog = (action, paymentId, userId, amount) => {
  logger.info(`Payment ${action}`, {
    paymentId,
    userId,
    amount,
    action,
    timestamp: new Date().toISOString()
  });
};

logger.transactionLog = (transactionId, status, details) => {
  logger.info(`Transaction ${status}`, {
    transactionId,
    status,
    details,
    timestamp: new Date().toISOString()
  });
};

logger.refundLog = (paymentId, refundId, amount) => {
  logger.info(`Refund processed`, {
    paymentId,
    refundId,
    amount,
    timestamp: new Date().toISOString()
  });
};

export default logger;
