import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// PostgreSQL connection configuration
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cinescope_movies',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize database schema
const initializeDatabase = async () => {
  try {
    const initSQLPath = path.join(process.cwd(), 'init.sql');
    if (fs.existsSync(initSQLPath)) {
      const initSQL = fs.readFileSync(initSQLPath, 'utf8');
      await pool.query(initSQL);
      console.log('✅ Database schema initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
};

// Test connection and initialize
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    console.log(`📂 Database: ${process.env.DB_NAME || 'cinescope_movies'}`);
    console.log(`🌐 Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
    await initializeDatabase();
    release();
  }
});

// Helper function for queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`📊 Query executed in ${duration}ms`);
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed after ${duration}ms:`, error.message);
    throw error;
  }
};

// Helper function for transactions
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🔄 Closing PostgreSQL connection pool...');
  pool.end(() => {
    console.log('✅ PostgreSQL connection pool closed');
    process.exit(0);
  });
});

export default pool;
