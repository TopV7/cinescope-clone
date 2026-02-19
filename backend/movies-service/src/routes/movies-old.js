import express from 'express';
import db from '../database.js';

const router = express.Router();

// Получить все фильмы
router.get('/', (req, res) => {
  const { page = 1, limit = 10, genre, search } = req.query;
  
  let query = 'SELECT * FROM movies WHERE 1=1';
  const params = [];

  // Фильтрация по жанру
  if (genre) {
    query += ' AND genre = ?';
    params.push(genre);
  }

  // Поиск по названию
  if (search) {
    query += ' AND title LIKE ?';
    params.push(`%${search}%`);
  }

  // Сортировка и пагинация
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const limitNum = parseInt(limit);
  const offset = (parseInt(page) - 1) * limitNum;
  params.push(limitNum, offset);

  db.all(query, params, (err, movies) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Получаем общее количество для пагинации
    let countQuery = 'SELECT COUNT(*) as total FROM movies WHERE 1=1';
    const countParams = [];
    
    if (genre) {
      countQuery += ' AND genre = ?';
      countParams.push(genre);
    }
    
    if (search) {
      countQuery += ' AND title LIKE ?';
      countParams.push(`%${search}%`);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        movies,
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limitNum)
        }
      });
    });
  });
});

// Получить фильм по ID
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM movies WHERE id = ?', [id], (err, movie) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({ movie });
  });
});

// Получить все жанры
router.get('/genres/list', (req, res) => {
  db.all('SELECT DISTINCT genre FROM movies ORDER BY genre', (err, genres) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      genres: genres.map(g => g.genre).filter(g => g) 
    });
  });
});

// Поиск фильмов
router.get('/search/query', (req, res) => {
  const { q: query, genre, minRating, maxRating, year } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  let sql = `
    SELECT * FROM movies 
    WHERE (title LIKE ? OR description LIKE ?)
  `;
  const params = [`%${query}%`, `%${query}%`];

  if (genre) {
    sql += ' AND genre = ?';
    params.push(genre);
  }

  if (minRating) {
    sql += ' AND rating >= ?';
    params.push(parseFloat(minRating));
  }

  if (maxRating) {
    sql += ' AND rating <= ?';
    params.push(parseFloat(maxRating));
  }

  if (year) {
    sql += ' AND release_year = ?';
    params.push(parseInt(year));
  }

  sql += ' ORDER BY rating DESC LIMIT 50';

  db.all(sql, params, (err, movies) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ 
      query,
      movies,
      count: movies.length 
    });
  });
});

// Получить популярные фильмы
router.get('/popular', (req, res) => {
  const { limit = 10 } = req.query;

  db.all(
    'SELECT * FROM movies ORDER BY rating DESC LIMIT ?',
    [parseInt(limit)],
    (err, movies) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ movies });
    }
  );
});

export default router;
