import authService from './authService';

const API_BASE_URL = 'http://localhost:3001/api';

interface ApiEndpointData {
  name: string;
  httpMethod: string;
  path: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  querySuggestion: string;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

class ApiService {
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

    // Add authorization header
    const token = authService.getAccessToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // If we get a 401, try to refresh the token
      if (response.status === 401 && token) {
        const refreshed = await authService.refreshAccessToken();
        if (refreshed) {
          // Retry the original request with the new token
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${authService.getAccessToken()}`,
          };
          const retryResponse = await fetch(url, config);
          return await retryResponse.json();
        } else {
          // Refresh failed, redirect to login
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

  // API Endpoints
  async getApiEndpoints(params?: { status?: string; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const endpoint = `/endpoints${queryString ? `?${queryString}` : ''}`;
    
    return this.makeRequest(endpoint);
  }

  async getApiEndpoint(id: string) {
    return this.makeRequest(`/endpoints/${id}`);
  }

  async createApiEndpoint(endpointData: ApiEndpointData) {
    return this.makeRequest('/endpoints', {
      method: 'POST',
      body: JSON.stringify(endpointData),
    });
  }

  async updateApiEndpoint(id: string, endpointData: Partial<ApiEndpointData>) {
    return this.makeRequest(`/endpoints/${id}`, {
      method: 'PUT',
      body: JSON.stringify(endpointData),
    });
  }

  async deleteApiEndpoint(id: string) {
    return this.makeRequest(`/endpoints/${id}`, {
      method: 'DELETE',
    });
  }

  async testApiEndpoint(id: string, parameters: Record<string, any> = {}) {
    return this.makeRequest(`/endpoints/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ parameters }),
    });
  }

  async getEndpointStats(timeRange = '24h') {
    return this.makeRequest(`/endpoints/stats?timeRange=${timeRange}`);
  }

  // Database Connections
  async getDatabaseConnections(activeOnly = false) {
    const endpoint = `/databases${activeOnly ? '?active=true' : ''}`;
    return this.makeRequest(endpoint);
  }

  async createDatabaseConnection(connectionData: any) {
    return this.makeRequest('/databases', {
      method: 'POST',
      body: JSON.stringify(connectionData),
    });
  }

  async updateDatabaseConnection(id: string, connectionData: any) {
    return this.makeRequest(`/databases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(connectionData),
    });
  }

  async deleteDatabaseConnection(id: string) {
    return this.makeRequest(`/databases/${id}`, {
      method: 'DELETE',
    });
  }

  async testDatabaseConnection(id: string) {
    return this.makeRequest(`/databases/${id}/test`, {
      method: 'POST',
    });
  }

  async getDatabaseSchema(id: string) {
    return this.makeRequest(`/databases/${id}/schema`);
  }
}

export const apiService = new ApiService();
export default apiService;