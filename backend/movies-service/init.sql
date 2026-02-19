-- Создаем таблицы для Movies Service (SQLite compatible)
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    duration INTEGER, -- в минутах
    genre TEXT,
    release_date TEXT,
    rating REAL DEFAULT 0.0,
    poster_url TEXT,
    trailer_url TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS movie_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    hall_number INTEGER NOT NULL,
    session_time TEXT NOT NULL,
    price REAL NOT NULL,
    available_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER REFERENCES movie_sessions(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    is_reserved INTEGER DEFAULT 0, -- 0 = false, 1 = true
    reservation_time TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_movie_sessions_movie_id ON movie_sessions(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_sessions_time ON movie_sessions(session_time);
CREATE INDEX IF NOT EXISTS idx_seats_session_id ON seats(session_id);
CREATE INDEX IF NOT EXISTS idx_seats_reserved ON seats(is_reserved);

-- Добавляем триггер для обновления updated_at (SQLite compatible)
CREATE TRIGGER IF NOT EXISTS update_movies_updated_at 
    AFTER UPDATE ON movies 
    FOR EACH ROW 
BEGIN
    UPDATE movies SET updated_at = datetime('now') WHERE id = NEW.id;
END;
