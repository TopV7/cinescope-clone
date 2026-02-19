// API Configuration
// В Docker используем относительные пути, в разработке - localhost
export const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:8080' : '');

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
    HEALTH: `${API_BASE_URL}/api/auth/health`
  },
  
  // Movies endpoints
  MOVIES: {
    LIST: `${API_BASE_URL}/api/movies`,
    BY_ID: (id: string) => `${API_BASE_URL}/api/movies/${id}`,
    SEARCH: (query: string) => `${API_BASE_URL}/api/movies/search?q=${encodeURIComponent(query)}`,
    GENRES: `${API_BASE_URL}/api/movies/genres`,
    POPULAR: `${API_BASE_URL}/api/movies/popular`,
    HEALTH: `${API_BASE_URL}/api/movies/health`
  },
  
  // Payment endpoints
  PAYMENT: {
    VALIDATE_CARD: `${API_BASE_URL}/api/payment/validate-card`,
    CREATE: `${API_BASE_URL}/api/payment/create`,
    STATUS: (transactionId: string) => `${API_BASE_URL}/api/payment/status/${transactionId}`,
    HISTORY: (userId: string) => `${API_BASE_URL}/api/payment/history/${userId}`,
    REFUND: `${API_BASE_URL}/api/payment/refund`,
    STATS: `${API_BASE_URL}/api/payment/stats`,
    HEALTH: `${API_BASE_URL}/api/payment/health`
  },
  
  // Gateway endpoints
  GATEWAY: {
    HEALTH: `${API_BASE_URL}/health`,
    SERVICES: `${API_BASE_URL}/services`,
    DOCS: `${API_BASE_URL}/api-docs`
  }
};

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    ...DEFAULT_HEADERS,
    'Authorization': `Bearer ${token}`
  };
};

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
