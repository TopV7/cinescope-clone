import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, pool } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

// Logger
import logger from '../logger.js';

const router = express.Router();

// Получаем секретные ключи с проверкой
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  console.error('🚨 FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

if (!JWT_REFRESH_SECRET) {
  console.error('🚨 FATAL: JWT_REFRESH_SECRET environment variable is not set!');
  process.exit(1);
}

// Валидация email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Rate limiting для защиты от брутфорса
const rateLimit = {};
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 минут
const RATE_LIMIT_MAX_REQUESTS = 5; // Максимум 5 попыток за 15 минут

const rateLimitMiddleware = (req, res, next) => {
  const key = `login_${req.ip}_${req.body.email || 'unknown'}`;
  const now = Date.now();
  
  if (!rateLimit[key]) {
    rateLimit[key] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  if (now > rateLimit[key].resetTime) {
    rateLimit[key] = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  }
  
  rateLimit[key].count++;
  
  if (rateLimit[key].count > RATE_LIMIT_MAX_REQUESTS) {
    console.log('🚫 Rate limit exceeded:', { ip: req.ip, email: req.body.email, count: rateLimit[key].count });
    return res.status(429).json({ 
      error: 'Too many attempts',
      message: `Rate limit exceeded. Try again in ${Math.ceil((rateLimit[key].resetTime - now) / 60000)} minutes`,
      retryAfter: Math.ceil((rateLimit[key].resetTime - now) / 1000)
    });
  }
  
  // Устанавливаем заголовки для информации о лимите
  res.set({
    'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS,
    'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX_REQUESTS - rateLimit[key].count),
    'X-RateLimit-Reset': new Date(rateLimit[key].resetTime).toISOString()
  });
  
  next();
};

// Очистка старых записей rate limiting (каждый час)
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimit).forEach(key => {
    if (now > rateLimit[key].resetTime) {
      delete rateLimit[key];
    }
  });
}, 60 * 60 * 1000); // 1 час

// Регистрация
router.post('/register', async (req, res) => {
  console.log('🔐 Registration request received:', { email: req.body.email, hasName: !!req.body.name });
  
  const { email, password, name } = req.body;

  if (!email || !password) {
    console.log('❌ Registration failed: Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Валидация email
  if (!isValidEmail(email)) {
    console.log('❌ Registration failed: Invalid email format');
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Валидация длины пароля
  if (password.length < 6) {
    console.log('❌ Registration failed: Password too short');
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    console.log('🔍 Checking if user exists:', email);
    // Проверяем есть ли пользователь с таймаутом
    const existingUserPromise = query('SELECT id FROM users WHERE email = $1', [email]);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), 5000)
    );
    
    const existingUser = await Promise.race([existingUserPromise, timeoutPromise]);
    
    if (existingUser.rows.length > 0) {
      console.log('❌ Registration failed: User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    console.log('🔐 Hashing password...');
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('💾 Creating user in database...');
    // Тестовый endpoint для проверки JSON
    router.post('/test', async (req, res) => {
      console.log('🔍 Test endpoint called');
      console.log('🔍 Headers:', req.headers);
      console.log('🔍 Body:', req.body);
      
      try {
        res.json({ 
          message: 'Test successful',
          received: req.body 
        });
      } catch (error) {
        console.error('❌ Test error:', error);
        res.status(500).json({ error: 'Test error' });
      }
    });

    // Вход пользователя с таймаутом
    const resultPromise = query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, hashedPassword, name || 'User', 'user']
    );
    const result = await Promise.race([resultPromise, timeoutPromise]);

    console.log('✅ User created successfully:', { userId: result.rows[0].id, email, name: name || 'User' });
    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.rows[0].id 
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// Вход
router.post('/login', rateLimitMiddleware, async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
  
  const { email, password } = req.body;

  if (!email || !password) {
    console.log('❌ Login failed: Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    console.log('🔍 Looking up user:', email);
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log('🔐 Comparing password for user:', user.id);

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔑 Creating JWT tokens for user:', user.id);
    // Создаем JWT токены
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

    // Сохраняем refresh токен в базу данных
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
    
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshTokenHash, expiresAt]
    );

    console.log('✅ Login successful:', { userId: user.id, email: user.email, name: user.name });
    res.json({
      message: 'Login successful',
      token: accessToken, // Изменяем accessToken на token
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

// Обновление токенов
router.post('/refresh', async (req, res) => {
  console.log('🔄 Token refresh request received');
  
  const { refreshToken } = req.body;

  if (!refreshToken) {
    console.log('❌ Refresh failed: Missing refresh token');
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Проверяем валидность refresh токена
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Ищем токен в базе данных
    const tokenResult = await query(
      'SELECT rt.*, u.email, u.name FROM refresh_tokens rt JOIN users u ON rt.user_id = u.id WHERE rt.user_id = $1 AND rt.is_revoked = FALSE AND rt.expires_at > NOW() ORDER BY rt.created_at DESC LIMIT 1',
      [decoded.userId]
    );

    if (tokenResult.rows.length === 0) {
      console.log('❌ Refresh failed: Token not found or expired');
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const storedToken = tokenResult.rows[0];
    const isValidToken = await bcrypt.compare(refreshToken, storedToken.token_hash);
    
    if (!isValidToken) {
      console.log('❌ Refresh failed: Invalid token hash');
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Отзываем старый токен
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE id = $1', [storedToken.id]);

    // Создаем новые токены
    const payload = { userId: decoded.userId, email: storedToken.email };
    const newAccessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

    // Сохраняем новый refresh токен
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 дней
    
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [decoded.userId, newRefreshTokenHash, expiresAt]
    );

    console.log('✅ Token refresh successful:', { userId: decoded.userId });
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error.message);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Запрос сброса пароля
router.post('/forgot-password', rateLimitMiddleware, async (req, res) => {
  console.log('🔐 Forgot password request received:', { email: req.body.email });
  
  const { email } = req.body;

  if (!email) {
    console.log('❌ Forgot password failed: Missing email');
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!isValidEmail(email)) {
    console.log('❌ Forgot password failed: Invalid email format');
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const result = await query('SELECT id, name FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Не раскрываем, существует ли пользователь
      console.log('✅ Forgot password email sent (user not found)');
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    const user = result.rows[0];
    
    // Генерируем токен сброса пароля
    const resetToken = jwt.sign({ userId: user.id, email }, JWT_SECRET, { expiresIn: '1h' });
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час
    
    // Сохраняем токен в базу данных
    await query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, resetTokenHash, expiresAt]
    );

    console.log('✅ Password reset token generated:', { userId: user.id, email });
    
    // В реальном приложении здесь отправка email
    console.log(`📧 Reset link: http://localhost:8080/reset-password?token=${resetToken}`);
    
    res.json({ 
      message: 'If the email exists, a reset link has been sent',
      // Для разработки возвращаем токен
      resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Сброс пароля
router.post('/reset-password', async (req, res) => {
  console.log('🔐 Reset password request received');
  
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    console.log('❌ Reset password failed: Missing token or new password');
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  if (newPassword.length < 6) {
    console.log('❌ Reset password failed: Password too short');
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  try {
    // Проверяем валидность токена
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ищем токен в базе данных
    const tokenResult = await query(
      'SELECT pr.*, u.email FROM password_resets pr JOIN users u ON pr.user_id = u.id WHERE pr.user_id = $1 AND pr.is_used = FALSE AND pr.expires_at > NOW() ORDER BY pr.created_at DESC LIMIT 1',
      [decoded.userId]
    );

    if (tokenResult.rows.length === 0) {
      console.log('❌ Reset password failed: Token not found, used, or expired');
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const storedToken = tokenResult.rows[0];
    const isValidToken = await bcrypt.compare(token, storedToken.token_hash);
    
    if (!isValidToken) {
      console.log('❌ Reset password failed: Invalid token hash');
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Обновляем пароль пользователя
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, decoded.userId]);

    // Отмечаем токен как использованный
    await query('UPDATE password_resets SET is_used = TRUE WHERE id = $1', [storedToken.id]);

    // Отзываем все refresh токены пользователя
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [decoded.userId]);

    console.log('✅ Password reset successful:', { userId: decoded.userId, email: storedToken.email });
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('❌ Reset password error:', error.message);
    res.status(400).json({ error: 'Invalid or expired reset token' });
  }
});

// Обновление профиля
router.put('/profile', authenticateToken, async (req, res) => {
  console.log('👤 Profile update request received:', { userId: req.user.userId });
  
  const { name, email } = req.body;
  const updates = {};
  
  try {
    // Валидация email если предоставлен
    if (email && email !== req.user.email) {
      if (!isValidEmail(email)) {
        console.log('❌ Profile update failed: Invalid email format');
        return res.status(400).json({ error: 'Invalid email format' });
      }
      
      // Проверяем, не занят ли email
      const existingUser = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.userId]);
      if (existingUser.rows.length > 0) {
        console.log('❌ Profile update failed: Email already exists');
        return res.status(400).json({ error: 'Email already exists' });
      }
      
      updates.email = email;
    }
    
    // Валидация имени если предоставлено
    if (name && name.trim().length > 0) {
      updates.name = name.trim().substring(0, 255); // Ограничиваем длину
    }
    
    if (Object.keys(updates).length === 0) {
      console.log('❌ Profile update failed: No valid fields to update');
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    // Строим динамический запрос
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [req.user.userId, ...Object.values(updates)];
    
    const result = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, email, name, created_at, updated_at`,
      values
    );
    
    console.log('✅ Profile updated successfully:', { userId: req.user.userId, updates });
    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Profile update error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Изменение пароля
router.put('/change-password', authenticateToken, async (req, res) => {
  console.log('🔐 Change password request received:', { userId: req.user.userId });
  
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    console.log('❌ Change password failed: Missing current password or new password');
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  
  if (newPassword.length < 6) {
    console.log('❌ Change password failed: New password too short');
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  
  try {
    // Получаем текущий пароль пользователя
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Change password failed: User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Проверяем текущий пароль
    const isValidPassword = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValidPassword) {
      console.log('❌ Change password failed: Invalid current password');
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Обновляем пароль
    await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, req.user.userId]);
    
    // Отзываем все refresh токены пользователя
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [req.user.userId]);
    
    console.log('✅ Password changed successfully:', { userId: req.user.userId });
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('❌ Change password error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  console.log('🚪 Logout request received:', { userId: req.user.userId });
  
  try {
    // Отзываем все refresh токены пользователя
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [req.user.userId]);
    
    console.log('✅ Logout successful:', { userId: req.user.userId });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout всех устройств
router.post('/logout-all', authenticateToken, async (req, res) => {
  console.log('🚪 Logout all devices request received:', { userId: req.user.userId });
  
  try {
    // Отзываем все refresh токены пользователя (включая текущий)
    await query('UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1', [req.user.userId]);
    
    console.log('✅ Logout all devices successful:', { userId: req.user.userId });
    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('❌ Logout all error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получение профиля пользователя
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получение текущего пользователя (алиас для /profile)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await query('SELECT id, email, name, created_at FROM users WHERE id = $1', [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Me endpoint error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Middleware для проверки прав доступа
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // В реальном приложении здесь проверка роли пользователя в базе данных
    // Пока упрощенная версия - все пользователи имеют роль 'user'
    const userRole = 'user'; // В будущем брать из базы данных
    
    if (roles.includes(userRole)) {
      req.userRole = userRole;
      return next();
    }
    
    console.log('🚫 Access denied:', { userId: req.user.userId, userRole, requiredRoles: roles });
    res.status(403).json({ error: 'Insufficient permissions' });
  };
};

// Middleware для проверки администраторских прав
const requireAdmin = requireRole(['admin']);

// Экспорт middleware для использования в других модулях
export { authenticateToken, requireRole, requireAdmin };

export default router;
