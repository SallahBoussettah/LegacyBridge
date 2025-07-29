const API_BASE_URL = 'http://localhost:3001/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: number;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
  errors?: Array<{ field: string; message: string }>;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  private saveTokensToStorage(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
    }
  }

  private clearTokensFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      this.accessToken = null;
      this.refreshToken = null;
    }
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authorization header if we have an access token
    if (this.accessToken && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // If we get a 401 and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/auth/refresh-token')) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with the new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${this.accessToken}`,
          };
          const retryResponse = await fetch(url, config);
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
          this.clearTokensFromStorage();
          window.location.href = '/login';
          return data;
        }
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error occurred',
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse['data']>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      this.saveTokensToStorage(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      
      // Save user data to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response as AuthResponse;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse['data']>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      this.saveTokensToStorage(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
      
      // Save user data to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }

    return response as AuthResponse;
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokensFromStorage();
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await this.makeRequest<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/refresh-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.success && response.data) {
        this.saveTokensToStorage(
          response.data.tokens.accessToken,
          response.data.tokens.refreshToken
        );
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  async getProfile() {
    return this.makeRequest('/auth/profile');
  }

  async updateProfile(profileData: { firstName?: string; lastName?: string; email?: string }) {
    return this.makeRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }) {
    return this.makeRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser() {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export const authService = new AuthService();
export default authService;