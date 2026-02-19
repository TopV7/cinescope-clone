// Валидация переменных окружения для Auth Service
import dotenv from 'dotenv';

// Загружаем .env перед проверками
dotenv.config();

const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'INTERNAL_JWT_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

// Валидация значений
if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
  console.error('❌ JWT_SECRET is set to default value. Please change it for security!');
  process.exit(1);
}

if (process.env.JWT_REFRESH_SECRET === 'your-super-secret-refresh-key-change-this-in-production') {
  console.error('❌ JWT_REFRESH_SECRET is set to default value. Please change it for security!');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');
