import jwt from 'jsonwebtoken';

// Получаем секрет для внутренних вызовов
const INTERNAL_JWT_SECRET = process.env.INTERNAL_JWT_SECRET;

if (!INTERNAL_JWT_SECRET) {
  console.error('🚨 FATAL: INTERNAL_JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Middleware для проверки внутреннего JWT (для межсервисных вызовов)
function authenticateInternal(req, res, next) {
  const internalToken = req.headers['x-internal-auth'];

  if (!internalToken) {
    // Если нет заголовка, пропускаем (для внешних запросов)
    return next();
  }

  try {
    // Проверяем JWT
    const decoded = jwt.verify(internalToken, INTERNAL_JWT_SECRET);

    // Добавляем информацию о внутреннем вызове
    req.internal = true;
    req.internalService = decoded.service || 'unknown';

    console.log(`🔗 Internal call from service: ${req.internalService}`);

    next();
  } catch (error) {
    console.error('❌ Invalid internal token:', error.message);
    return res.status(403).json({ error: 'Invalid internal authentication' });
  }
}

export { authenticateInternal };
