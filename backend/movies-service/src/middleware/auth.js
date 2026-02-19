import jwt from 'jsonwebtoken';

// Получаем секретный ключ с проверкой
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('🚨 FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Middleware для проверки токена
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware для проверки прав доступа к своим данным
function requireOwnership(req, res, next) {
  const requestedUserId = parseInt(req.params.userId || req.body.userId);
  
  if (req.user.userId !== requestedUserId) {
    console.log('🚫 Access denied: User trying to access another user\'s data', { 
      userId: req.user.userId, 
      requestedUserId 
    });
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}

export { authenticateToken, requireOwnership };
