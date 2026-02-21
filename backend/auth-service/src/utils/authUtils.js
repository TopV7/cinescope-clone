// Утилиты для аутентификации
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Rate limiting для защиты от брутфорса
export const createRateLimiter = () => {
  const rateLimit = {};
  const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 минут
  const RATE_LIMIT_MAX_REQUESTS = 5; // Максимум 5 попыток за 15 минут

  return {
    check: (key) => {
      const now = Date.now();

      if (!rateLimit[key]) {
        rateLimit[key] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      }

      if (now > rateLimit[key].resetTime) {
        rateLimit[key] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
      }

      rateLimit[key].count++;

      if (rateLimit[key].count > RATE_LIMIT_MAX_REQUESTS) {
        return { allowed: false, remaining: 0 };
      }

      return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - rateLimit[key].count };
    }
  };
};

export const rateLimitMiddleware = (rateLimiter) => {
  return (req, res, next) => {
    const key = `login_${req.ip}_${req.body.email || 'unknown'}`;
    const result = rateLimiter.check(key);

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too many login attempts',
        message: 'Please try again later',
        retryAfter: Math.ceil((rateLimit[key].resetTime - Date.now()) / 1000)
      });
    }

    next();
  };
};
