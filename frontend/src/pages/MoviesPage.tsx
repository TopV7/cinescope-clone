import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { movieService, type Movie } from '../services/movieService';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

const MoviesPage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleBuyTicket = async (movie: Movie) => {
    if (!authService.isAuthenticated()) {
      alert('Пожалуйста, войдите в систему');
      return;
    }

    try {
      const user = authService.getCurrentUser();
      await paymentService.createPayment({
        userId: user?.id || 0,
        amount: movie.rating || 100,
        currency: 'RUB',
        description: `Билет на фильм: ${movie.title}`,
        cardData: {
          cardNumber: '4242424242424242',
          cvv: '123',
          expiryMonth: '12',
          expiryYear: '25'
        }
      });
      alert('Билет успешно куплен!');
    } catch (e) {
      alert('Ошибка покупки билета: ' + (e as Error).message);
    }
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const response = await movieService.getMovies();
        setMovies(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch movies');
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка фильмов...</p>
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
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🎬 Фильмы</h1>
          <p className="text-gray-600 text-lg">Выберите фильм для просмотра</p>
        </div>

        {movies.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-4">📽 Фильмов не найдено</div>
            <p className="text-gray-400">Попробуйте обновить страницу позже</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
                <div className="relative">
                  <img 
                    src={movie.poster_url} 
                    alt={movie.title}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/300x450?text=' + movie.title;
                    }}
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 text-gray-900">{movie.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{movie.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl font-bold text-red-600">₽{movie.rating}</span>
                        <span className="text-sm text-gray-500">/10</span>
                      </div>
                      <div className="flex items-center space-x-2">
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
                    <div className="flex justify-between items-center">
                      <Link 
                        to={`/movies/${movie.id}`}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
                      >
                        Подробнее
                      </Link>
                      <button 
                        onClick={() => handleBuyTicket(movie)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
                      >
                        Купить билет
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviesPage;
