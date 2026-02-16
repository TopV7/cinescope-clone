import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'payments.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    createTables();
  }
});

function createTables() {
  // Создаем таблицу платежей
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'pending',
      card_last_four TEXT,
      transaction_id TEXT UNIQUE,
      payment_method TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating payments table:', err.message);
    } else {
      console.log('✅ Payments table created or already exists');
      addSamplePayments();
    }
  });
}

function addSamplePayments() {
  // Добавляем несколько примеров платежей
  const samplePayments = [
    {
      user_id: 1,
      amount: 15.99,
      currency: 'USD',
      status: 'completed',
      card_last_four: '1234',
      transaction_id: 'txn_1234567890',
      payment_method: 'credit_card',
      description: 'Movie ticket - Inception'
    },
    {
      user_id: 2,
      amount: 12.50,
      currency: 'USD',
      status: 'completed',
      card_last_four: '5678',
      transaction_id: 'txn_0987654321',
      payment_method: 'debit_card',
      description: 'Movie ticket - The Dark Knight'
    },
    {
      user_id: 1,
      amount: 18.00,
      currency: 'USD',
      status: 'pending',
      card_last_four: '9012',
      transaction_id: 'txn_1122334455',
      payment_method: 'credit_card',
      description: 'Movie ticket - Interstellar'
    }
  ];

  samplePayments.forEach(payment => {
    db.run(`
      INSERT OR IGNORE INTO payments (user_id, amount, currency, status, card_last_four, transaction_id, payment_method, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      payment.user_id,
      payment.amount,
      payment.currency,
      payment.status,
      payment.card_last_four,
      payment.transaction_id,
      payment.payment_method,
      payment.description
    ]);
  });

  console.log('✅ Sample payments added');
}

export default db;
