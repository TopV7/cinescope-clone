import { API_ENDPOINTS, getAuthHeaders, type ApiResponse } from './api';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}

// Auth Service
export const authService = {
  // Login user
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    console.log('Frontend: Starting login', { email: credentials.email });
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Frontend: Login request sent', { url: API_ENDPOINTS.AUTH.LOGIN, status: response.status });
      const data = await response.json();
      console.log('Frontend: Login response received', { status: response.status, success: !!data.token, error: data.error });

      if (!response.ok) {
        console.error('Frontend: Login failed', { status: response.status, error: data.error });
        return {
          success: false,
          error: data.error || 'Login failed',
        };
      }

      // Save token to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Frontend: Login successful, token saved');
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Frontend: Login network error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  // Register user
  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    console.log('Frontend: Starting registration', { email: userData.email, name: userData.name });
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Frontend: Registration request sent', { url: API_ENDPOINTS.AUTH.REGISTER, status: response.status });
      const data = await response.json();
      console.log('Frontend: Registration response received', { status: response.status, success: !!data.token, error: data.error });

      if (!response.ok) {
        console.error('Frontend: Registration failed', { status: response.status, error: data.error });
        return {
          success: false,
          error: data.error || 'Registration failed',
        };
      }

      // Save token to localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Frontend: Registration successful, token saved');
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('Frontend: Registration network error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  // Get user profile
  async getProfile(): Promise<ApiResponse<User>> {
    console.log('Frontend: Starting get profile');
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
        headers: getAuthHeaders(),
      });

      console.log('Frontend: Get profile request sent', { url: API_ENDPOINTS.AUTH.PROFILE, status: response.status });
      const data = await response.json();
      console.log('Frontend: Get profile response received', { status: response.status, hasUser: !!data.user });

      if (!response.ok) {
        console.error('Frontend: Get profile failed', { status: response.status, error: data.error });
        return {
          success: false,
          error: data.error || 'Failed to get profile',
        };
      }

      return {
        success: true,
        data: data.user || data,
      };
    } catch (error) {
      console.error('Frontend: Get profile network error', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  },

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get current user
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get token
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  // Check auth service health
  async checkHealth(): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.HEALTH);
      const data = await response.json();

      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
      };
    }
  },
};

export default authService;
