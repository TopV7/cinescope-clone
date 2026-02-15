import axios from 'axios';
import { Movie, MovieSession } from '../types/movie';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const movieService = {
  // Получить все фильмы
  getAllMovies: async (): Promise<Movie[]> => {
    const response = await api.get('/movies');
    return response.data;
  },

  // Получить фильм по ID
  getMovieById: async (id: string): Promise<Movie> => {
    const response = await api.get(`/movies/${id}`);
    return response.data;
  },

  // Получить сеансы фильма
  getMovieSessions: async (movieId: string): Promise<MovieSession[]> => {
    const response = await api.get(`/movies/${movieId}/sessions`);
    return response.data;
  },

  // Поиск фильмов
  searchMovies: async (query: string): Promise<Movie[]> => {
    const response = await api.get(`/movies/search?q=${query}`);
    return response.data;
  },
};
