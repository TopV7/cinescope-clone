// Валидация переменных окружения для Payment Service
import dotenv from 'dotenv';

// Загружаем .env перед проверками
dotenv.config();

const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'PAYMENT_GATEWAY_URL',
  'PAYMENT_GATEWAY_API_KEY',
  'PAYMENT_GATEWAY_SECRET',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'INTERNAL_JWT_SECRET'
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

if (process.env.ENCRYPTION_KEY === 'your-32-character-encryption-key') {
  console.error('❌ ENCRYPTION_KEY is set to default value. Please change it for security!');
  process.exit(1);
}

if (process.env.ENCRYPTION_KEY.length !== 32) {
  console.error('❌ ENCRYPTION_KEY must be exactly 32 characters long for AES-256 encryption.');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');
