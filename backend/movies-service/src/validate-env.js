// Валидация переменных окружения для Movies Service
import dotenv from 'dotenv';

// Загружаем .env перед проверками
dotenv.config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'INTERNAL_JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');
