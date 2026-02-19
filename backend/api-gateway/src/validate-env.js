// Валидация переменных окружения для API Gateway
import dotenv from 'dotenv';

// Загружаем .env перед проверками
dotenv.config();

const requiredEnvVars = [
  'AUTH_SERVICE_URL',
  'MOVIES_SERVICE_URL',
  'PAYMENT_SERVICE_URL',
  'INTERNAL_JWT_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file or environment configuration.');
  process.exit(1);
}

console.log('✅ Environment variables validated successfully');
