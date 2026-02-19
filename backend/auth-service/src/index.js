import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';

// Загружаем .env ПЕРЕД всеми импортами
dotenv.config();

// Валидируем переменные окружения
import './validate-env.js';

import './database.js'; // Инициализация базы данных

// Middleware для внутреннего JWT
import { authenticateInternal } from './middleware/internalAuth.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// JSON parser ДО логирования
app.use(express.json());

// Middleware для проверки внутреннего JWT
app.use(authenticateInternal);

// Логирование всех запросов
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/auth', authRoutes);

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/auth`);
});

export default app;
