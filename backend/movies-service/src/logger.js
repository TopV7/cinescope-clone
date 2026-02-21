import winston from 'winston';

// Настройка логгера с подробным выводом для movies-service
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'movies-service' },
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
      filename: 'logs/movies-error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      )
    }),
    // Файловый транспорт для всех логов
    new winston.transports.File({
      filename: 'logs/movies-combined.log',
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

// Дополнительные методы для подробного логирования фильмов
logger.movieLog = (action, movieId, userId) => {
  logger.info(`Movie ${action}`, {
    movieId,
    userId,
    action,
    timestamp: new Date().toISOString()
  });
};

logger.searchLog = (query, resultsCount, userId) => {
  logger.info(`Movie search performed`, {
    query,
    resultsCount,
    userId,
    timestamp: new Date().toISOString()
  });
};

logger.ratingLog = (movieId, userId, rating) => {
  logger.info(`Movie rating submitted`, {
    movieId,
    userId,
    rating,
    timestamp: new Date().toISOString()
  });
};

export default logger;
