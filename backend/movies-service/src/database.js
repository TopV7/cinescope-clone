import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'movies.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database');
    createTables();
  }
});

function createTables() {
  // Создаем таблицу фильмов
  db.run(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration INTEGER,
      rating REAL,
      poster_url TEXT,
      genre TEXT,
      release_year INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating movies table:', err.message);
    } else {
      console.log('✅ Movies table created or already exists');
      addSampleMovies();
    }
  });
}

function addSampleMovies() {
  // Добавляем несколько фильмов для примера
  const sampleMovies = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology.',
      duration: 148,
      rating: 8.8,
      poster_url: 'https://picsum.photos/seed/inception/300/450.jpg',
      genre: 'Sci-Fi',
      release_year: 2010
    },
    {
      title: 'The Dark Knight',
      description: 'Batman faces the Joker in a battle for Gotham City.',
      duration: 152,
      rating: 9.0,
      poster_url: 'https://picsum.photos/seed/darkknight/300/450.jpg',
      genre: 'Action',
      release_year: 2008
    },
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space.',
      duration: 169,
      rating: 8.6,
      poster_url: 'https://picsum.photos/seed/interstellar/300/450.jpg',
      genre: 'Sci-Fi',
      release_year: 2014
    }
  ];

  sampleMovies.forEach(movie => {
    db.run(`
      INSERT OR IGNORE INTO movies (title, description, duration, rating, poster_url, genre, release_year)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      movie.title,
      movie.description,
      movie.duration,
      movie.rating,
      movie.poster_url,
      movie.genre,
      movie.release_year
    ]);
  });

  console.log('✅ Sample movies added');
}

export default db;
