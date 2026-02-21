import express from 'express';
import { query } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Функция валидации данных фильма
export const validateMovieData = (data) => {
  const errors = [];

  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }

  if (!data.duration || typeof data.duration !== 'number' || data.duration <= 0) {
    errors.push('Duration is required and must be a positive number');
  }

  if (!data.genre || typeof data.genre !== 'string' || data.genre.trim().length === 0) {
    errors.push('Genre is required and must be a non-empty string');
  }

  if (data.rating !== undefined && (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 10)) {
    errors.push('Rating must be a number between 0 and 10');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Применяем аутентификацию ко всем маршрутам
router.use(authenticateToken);

// Создать новый фильм
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      genre,
      release_date,
      release_year,
      rating,
      poster_url,
      trailer_url
    } = req.body;

    // Валидация обязательных полей
    if (!title || !duration || !genre) {
      return res.status(400).json({ 
        error: 'Missing required fields: title, duration, genre' 
      });
    }

    // Валидация duration (должна быть положительным числом)
    if (duration <= 0) {
      return res.status(400).json({ 
        error: 'Duration must be a positive number' 
      });
    }

    // Валидация rating (должна быть от 0 до 10)
    if (rating && (rating < 0 || rating > 10)) {
      return res.status(400).json({ 
        error: 'Rating must be between 0 and 10' 
      });
    }

    const result = await query(
      `INSERT INTO movies (title, description, duration, genre, release_date, release_year, rating, poster_url, trailer_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [title, description, duration, genre, release_date, release_year, rating || 0, poster_url, trailer_url]
    );

    console.log('✅ Movie created successfully:', { 
      movieId: result.rows[0].id, 
      title: result.rows[0].title,
      userId: req.user.userId 
    });

    res.status(201).json({ 
      message: 'Movie created successfully',
      movie: result.rows[0] 
    });
  } catch (error) {
    console.error('❌ Movie creation error:', error.message);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить все фильмы
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, genre, search } = req.query;
    
    let sql = 'SELECT * FROM movies WHERE 1=1';
    const params = [];

    // Фильтрация по жанру
    if (genre) {
      sql += ' AND genre = $1';
      params.push(genre);
    }

    // Поиск по названию
    if (search) {
      sql += ' AND title ILIKE $' + (params.length + 1);
      params.push(`%${search}%`);
    }

    // Сортировка и пагинация
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;
    params.push(limitNum, offset);

    const moviesResult = await query(sql, params);

    // Получить общее количество для пагинации
    let countSql = 'SELECT COUNT(*) as total FROM movies WHERE 1=1';
    const countParams = [];
    
    if (genre) {
      countSql += ' AND genre = $1';
      countParams.push(genre);
    }
    
    if (search) {
      countSql += ' AND title ILIKE $' + (countParams.length + 1);
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countSql, countParams);

    res.json({
      movies: moviesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить фильм по ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const movieResult = await query('SELECT * FROM movies WHERE id = $1', [id]);

    if (movieResult.rows.length === 0) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({ movie: movieResult.rows[0] });
  } catch (error) {
    console.error('Error fetching movie:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить все жанры
router.get('/genres', async (req, res) => {
  try {
    const genresResult = await query('SELECT DISTINCT genre FROM movies ORDER BY genre');

    res.json({ 
      genres: genresResult.rows.map(g => g.genre).filter(g => g)
    });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Поиск фильмов
router.get('/search/query', async (req, res) => {
  try {
    const { q: searchQuery, genre, minRating, maxRating, year, page = 1, limit = 10 } = req.query;

    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let sql = `
      SELECT * FROM movies 
      WHERE (title ILIKE $1 OR description ILIKE $2)
    `;
    const params = [`%${searchQuery}%`, `%${searchQuery}%`];

    if (genre) {
      sql += ' AND genre = $' + (params.length + 1);
      params.push(genre);
    }

    if (minRating) {
      sql += ' AND rating >= $' + (params.length + 1);
      params.push(parseFloat(minRating));
    }

    if (maxRating) {
      sql += ' AND rating <= $' + (params.length + 1);
      params.push(parseFloat(maxRating));
    }

    if (year) {
      sql += ' AND release_year = $' + (params.length + 1);
      params.push(parseInt(year));
    }

    // Добавляем пагинацию
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;
    sql += ' ORDER BY rating DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limitNum, offset);

    const moviesResult = await query(sql, params);

    // Получить общее количество для пагинации
    let countSql = `
      SELECT COUNT(*) as total FROM movies 
      WHERE (title ILIKE $1 OR description ILIKE $2)
    `;
    const countParams = [`%${searchQuery}%`, `%${searchQuery}%`];

    if (genre) {
      countSql += ' AND genre = $' + (countParams.length + 1);
      countParams.push(genre);
    }

    if (minRating) {
      countSql += ' AND rating >= $' + (countParams.length + 1);
      countParams.push(parseFloat(minRating));
    }

    if (maxRating) {
      countSql += ' AND rating <= $' + (countParams.length + 1);
      countParams.push(parseFloat(maxRating));
    }

    if (year) {
      countSql += ' AND release_year = $' + (countParams.length + 1);
      countParams.push(parseInt(year));
    }

    const countResult = await query(countSql, countParams);

    res.json({ 
      query: searchQuery,
      movies: moviesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Получить популярные фильмы
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const moviesResult = await query(
      'SELECT * FROM movies ORDER BY rating DESC LIMIT $1',
      [parseInt(limit)]
    );

    res.json({ movies: moviesResult.rows });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
