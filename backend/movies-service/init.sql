-- Создаем таблицы для Movies Service
CREATE TABLE IF NOT EXISTS movies (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER, -- в минутах
    genre VARCHAR(100),
    release_date DATE,
    rating DECIMAL(3,1) DEFAULT 0.0,
    poster_url VARCHAR(500),
    trailer_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movie_sessions (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    hall_number INTEGER NOT NULL,
    session_time TIMESTAMP WITH TIME ZONE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES movie_sessions(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    seat_number INTEGER NOT NULL,
    is_reserved BOOLEAN DEFAULT FALSE,
    reservation_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Создаем индексы для производительности
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_movie_sessions_movie_id ON movie_sessions(movie_id);
CREATE INDEX IF NOT EXISTS idx_movie_sessions_time ON movie_sessions(session_time);
CREATE INDEX IF NOT EXISTS idx_seats_session_id ON seats(session_id);
CREATE INDEX IF NOT EXISTS idx_seats_reserved ON seats(is_reserved);

-- Добавляем триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_movies_updated_at 
    BEFORE UPDATE ON movies 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
