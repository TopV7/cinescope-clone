import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import moviesRoutes from './routes/movies.js';

// Загружаем .env ПЕРЕД всеми импортами
dotenv.config();

import './database.js'; // Инициализация базы данных

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());

// Health check (ДО routes!)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'movies-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Routes
app.use('/', moviesRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🎬 Movies Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      movies: '/movies',
      movieById: '/movies/:id',
      search: '/movies/search/query?q=...',
      genres: '/movies/genres/list',
      popular: '/movies/popular'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found` 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🎬 Movies Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🎥 Movies API: http://localhost:${PORT}/movies`);
  console.log(`🔍 Search: http://localhost:${PORT}/movies/search/query?q=inception`);
});

export default app;
