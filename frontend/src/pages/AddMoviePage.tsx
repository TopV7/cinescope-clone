import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService, type CreateMovieRequest } from '../services/movieService';
import { authService } from '../services/authService';

const AddMoviePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateMovieRequest>({
    title: '',
    description: '',
    duration: 0,
    genre: '',
    release_date: '',
    release_year: new Date().getFullYear(),
    rating: 0,
    poster_url: '',
    trailer_url: ''
  });

  const genres = [
    'Боевик', 'Комедия', 'Драма', 'Ужасы', 'Фантастика',
    'Триллер', 'Мелодрама', 'Детектив', 'Приключения', 'Аниме',
    'Мультфильм', 'Документальный', 'Исторический', 'Военный'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'release_year' || name === 'rating' 
        ? Number(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authService.isAuthenticated()) {
      setError('Пожалуйста, войдите в систему для добавления фильма');
      return;
    }

    // Валидация
    if (!formData.title.trim()) {
      setError('Название фильма обязательно');
      return;
    }

    if (formData.duration <= 0) {
      setError('Длительность должна быть положительным числом');
      return;
    }

    if (!formData.genre) {
      setError('Жанр обязателен');
      return;
    }

    if (formData.rating && (formData.rating < 0 || formData.rating > 10)) {
      setError('Рейтинг должен быть от 0 до 10');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await movieService.createMovie(formData);
      setSuccess(true);
      
      // Через 2 секунды перенаправляем на страницу фильмов
      setTimeout(() => {
        navigate('/movies');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка при добавлении фильма');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-success text-center">
              <h4>✅ Фильм успешно добавлен!</h4>
              <p>Вы будете перенаправлены на страницу фильмов через несколько секунд...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mb-0">Добавить новый фильм</h3>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label htmlFor="title" className="form-label">
                      Название фильма *
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label htmlFor="genre" className="form-label">
                      Жанр *
                    </label>
                    <select
                      className="form-select"
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Выберите жанр...</option>
                      {genres.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="form-label">
                    Описание
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Краткое описание фильма..."
                  />
                </div>

                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label htmlFor="duration" className="form-label">
                      Длительность (минуты) *
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      min="1"
                      required
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="release_year" className="form-label">
                      Год выпуска
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="release_year"
                      name="release_year"
                      value={formData.release_year}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear() + 5}
                    />
                  </div>

                  <div className="col-md-4 mb-3">
                    <label htmlFor="rating" className="form-label">
                      Рейтинг (0-10)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="rating"
                      name="rating"
                      value={formData.rating}
                      onChange={handleChange}
                      min="0"
                      max="10"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="release_date" className="form-label">
                    Дата выхода
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    id="release_date"
                    name="release_date"
                    value={formData.release_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="poster_url" className="form-label">
                    URL постера
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    id="poster_url"
                    name="poster_url"
                    value={formData.poster_url}
                    onChange={handleChange}
                    placeholder="https://example.com/poster.jpg"
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="trailer_url" className="form-label">
                    URL трейлера
                  </label>
                  <input
                    type="url"
                    className="form-control"
                    id="trailer_url"
                    name="trailer_url"
                    value={formData.trailer_url}
                    onChange={handleChange}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/movies')}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Добавление...
                      </>
                    ) : (
                      'Добавить фильм'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMoviePage;
