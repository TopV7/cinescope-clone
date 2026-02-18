import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, pool } from '../database.js';

const router = express.Router();

// Получаем секретный ключ с проверкой
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  console.error('🚨 FATAL: JWT_SECRET environment variable is not set!');
  process.exit(1);
}

// Валидация email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Регистрация
router.post('/register', async (req, res) => {
  console.log('🔐 Registration request received:', { email: req.body.email, hasPassword: !!req.body.password, hasName: !!req.body.name });
  
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
    // Создаем пользователя с таймаутом
    const resultPromise = query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, name || 'User']
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
router.post('/login', async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email, hasPassword: !!req.body.password });
  
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

    console.log('🔑 Creating JWT token for user:', user.id);
    // Создаем JWT токен
    const payload = { userId: user.id, email: user.email };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    console.log('✅ Login successful:', { userId: user.id, email: user.email, name: user.name });
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error' });
  }
});

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
    return res.status(401).json({ error: 'Invalid token' });
  }
}

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

export default router;
