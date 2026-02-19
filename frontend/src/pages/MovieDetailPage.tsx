import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { movieService, type Movie } from '../services/movieService';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBuyTicket = async () => {
    if (!authService.isAuthenticated()) {
      alert('Пожалуйста, войдите в систему');
      return;
    }

    // В реальном приложении здесь будет форма ввода данных карты
    const cardData = {
      cardNumber: prompt('Номер карты:') || '',
      cvv: prompt('CVV:') || '',
      expiryMonth: prompt('Месяц (ММ):') || '',
      expiryYear: prompt('Год (ГГ):') || ''
    };

    if (!cardData.cardNumber || !cardData.cvv || !cardData.expiryMonth || !cardData.expiryYear) {
      alert('Все поля карты обязательны');
      return;
    }

    try {
      const user = authService.getCurrentUser();
      await paymentService.createPayment({
        userId: user?.id || 0,
        amount: movie?.rating || 100,
        currency: 'RUB',
        description: `Билет на фильм: ${movie?.title}`,
        cardData
      });
      alert('Билет успешно куплен!');
    } catch (e) {
      alert('Ошибка покупки билета: ' + (e as Error).message);
    }
  };

  const handleAddToFavorites = () => {
    if (!authService.isAuthenticated()) {
      alert('Пожалуйста, войдите в систему');
      return;
    }
    alert(`Фильм "${movie?.title}" добавлен в избранное`);
  };

  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return; // Проверяем что id существует
      
      try {
        setLoading(true);
        const response = await movieService.getMovieById(id);
        setMovie(response);
        setError(null);
      } catch (err) {
        setError('Failed to fetch movie');
        console.error('Error fetching movie:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка фильма...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Ошибка</div>
          <p className="text-gray-600">{error}</p>
          <Link 
            to="/movies"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Вернуться к фильмам
          </Link>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-xl mb-4">📽 Фильм не найден</div>
          <p className="text-gray-400">Фильм с ID {id} не существует</p>
          <Link 
            to="/movies"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Вернуться к фильмам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link 
            to="/movies"
            className="text-blue-600 hover:text-blue-800 flex items-center"
          >
            ← Вернуться к фильмам
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            <div className="md:shrink-0">
              <img 
                src={movie.poster_url} 
                alt={movie.title}
                className="h-96 w-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/400x600?text=' + movie.title;
                }}
              />
            </div>
            <div className="p-8">
              <div className="uppercase tracking-wide text-sm text-indigo-600 font-semibold">
                {movie.genre}
              </div>
              <h1 className="mt-4 text-3xl font-bold text-gray-900">
                {movie.title}
              </h1>
              <div className="mt-2 flex items-center">
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-red-600">₽{movie.rating}</span>
                  <span className="text-gray-500">/10</span>
                </div>
                <div className="ml-4 flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                    {movie.genre}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {movie.release_year}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {movie.duration} мин
                  </span>
                </div>
              </div>
              <p className="mt-4 text-gray-600 leading-relaxed">
                {movie.description}
              </p>
              <div className="mt-8 flex space-x-4">
                <button 
                  onClick={handleBuyTicket}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Купить билет
                </button>
                <button 
                  onClick={handleAddToFavorites}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-3 rounded-lg font-semibold"
                >
                  Добавить в избранное
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
