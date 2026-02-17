import { API_ENDPOINTS, getAuthHeaders, type PaginatedResponse } from './api';

// Types
export interface Movie {
  id: number;
  title: string;
  description: string;
  duration: number;
  rating: number;
  poster_url: string;
  genre: string;
  release_year: number;
  created_at: string;
  updated_at: string;
}

export interface MovieSearchParams {
  page?: number;
  limit?: number;
  genre?: string;
  search?: string;
  sortBy?: 'title' | 'rating' | 'release_year';
  sortOrder?: 'asc' | 'desc';
}

// Movies Service
export const movieService = {
  // Get all movies with pagination
  async getMovies(params: MovieSearchParams = {}): Promise<PaginatedResponse<Movie>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.genre) searchParams.append('genre', params.genre);
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

      const url = params.search 
        ? API_ENDPOINTS.MOVIES.SEARCH(params.search)
        : `${API_ENDPOINTS.MOVIES.LIST}?${searchParams.toString()}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch movies');
      }

      return {
        data: data.movies || data.data || [],
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: data.total || 0,
          pages: Math.ceil((data.total || 0) / (params.limit || 10)),
        },
      };
    } catch (error) {
      console.error('Error fetching movies:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };
    }
  },

  // Get movie by ID
  async getMovieById(id: string): Promise<Movie | null> {
    try {
      const response = await fetch(API_ENDPOINTS.MOVIES.BY_ID(id), {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch movie');
      }

      return data.movie || data;
    } catch (error) {
      console.error('Error fetching movie:', error);
      return null;
    }
  },

  // Search movies
  async searchMovies(query: string, params: MovieSearchParams = {}): Promise<PaginatedResponse<Movie>> {
    return this.getMovies({ ...params, search: query });
  },

  // Get movies by genre
  async getMoviesByGenre(genre: string, params: MovieSearchParams = {}): Promise<PaginatedResponse<Movie>> {
    return this.getMovies({ ...params, genre });
  },

  // Get popular movies
  async getPopularMovies(params: MovieSearchParams = {}): Promise<PaginatedResponse<Movie>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());

      const url = `${API_ENDPOINTS.MOVIES.POPULAR}?${searchParams.toString()}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch popular movies');
      }

      return {
        data: data.movies || data.data || [],
        pagination: data.pagination || {
          page: params.page || 1,
          limit: params.limit || 10,
          total: data.total || 0,
          pages: Math.ceil((data.total || 0) / (params.limit || 10)),
        },
      };
    } catch (error) {
      console.error('Error fetching popular movies:', error);
      return {
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0,
        },
      };
    }
  },

  // Get all genres
  async getGenres(): Promise<string[]> {
    try {
      const response = await fetch(API_ENDPOINTS.MOVIES.GENRES, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch genres');
      }

      return data.genres || [];
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  },

  // Check movies service health
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.MOVIES.HEALTH);
      return await response.json();
    } catch (error) {
      console.error('Movies service health check failed:', error);
      return null;
    }
  },
};

export default movieService;
