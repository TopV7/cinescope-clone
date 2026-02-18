const { Pool } = require('pg');

// Конфигурация подключения к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'auth-db',  // ✅ Имя сервиса из docker-compose
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'auth_db',
  user: process.env.DB_USER || 'auth_user',
  password: process.env.DB_PASSWORD || 'auth_password',
  max: 20, // максимальное количество соединений
  idleTimeoutMillis: 30000, // время ожидания простоя
  connectionTimeoutMillis: 2000, // время ожидания подключения
});

// Проверяем подключение
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'auth_db'}`);
    console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    release();
  }
});

// Функция для выполнения запросов
const query = (text, params) => {
  return new Promise((resolve, reject) => {
    pool.query(text, params, (err, result) => {
      if (err) {
        console.error('Database query error:', err.message);
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Closing PostgreSQL connection pool...');
  pool.end(() => {
    console.log('✅ PostgreSQL connection pool closed');
    process.exit(0);
  });
});

export {
  query,
  pool
};
