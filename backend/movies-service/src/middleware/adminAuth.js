import jwt from 'jsonwebtoken';

const INTERNAL_JWT_SECRET = process.env.INTERNAL_JWT_SECRET;

if (!INTERNAL_JWT_SECRET) {
  console.error('🚨 FATAL: INTERNAL_JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Проверка внутреннего JWT токена для сервисов
export const authenticateInternal = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Internal token is required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, INTERNAL_JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid internal token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Internal token expired' });
    }
    console.error('Internal auth middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Проверка админских прав для внутренних сервисов
export const requireAdminInternal = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Internal token is required' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, INTERNAL_JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid internal token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Internal token expired' });
    }
    console.error('Admin internal middleware error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};
