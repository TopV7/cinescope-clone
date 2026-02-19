-- Создаем таблицы для Payment Service (SQLite compatible)
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL,
    seats TEXT, -- JSON массив номеров мест
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'RUB',
    status TEXT DEFAULT 'pending', -- pending, completed, failed, refunded
    payment_method TEXT, -- card, cash, etc.
    card_last_four TEXT,
    transaction_id TEXT UNIQUE,
    gateway_response TEXT, -- JSON как TEXT
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER REFERENCES payments(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending', -- pending, completed, failed
    refund_transaction_id TEXT,
    gateway_response TEXT, -- JSON как TEXT
    created_at TEXT DEFAULT (datetime('now')),
    processed_at TEXT
);

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_session_id ON payments(session_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- Добавляем триггер для обновления updated_at (SQLite compatible)
CREATE TRIGGER IF NOT EXISTS update_payments_updated_at 
    AFTER UPDATE ON payments 
    FOR EACH ROW 
BEGIN
    UPDATE payments SET updated_at = datetime('now') WHERE id = NEW.id;
END;
