import { ApiEndpoint, ApiUsageLog } from '../models/index.js';

// Get all API endpoints for the authenticated user
export const getApiEndpoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const endpoints = await ApiEndpoint.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
    });

    const total = await ApiEndpoint.count({ where: whereClause });

    res.json({
      success: true,
      data: {
        endpoints,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get API endpoints error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API endpoints'
    });
  }
};

// Get a specific API endpoint
export const getApiEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const endpoint = await ApiEndpoint.findByUserAndId(userId, id);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }

    res.json({
      success: true,
      data: { endpoint }
    });
  } catch (error) {
    console.error('Get API endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API endpoint'
    });
  }
};

// Create a new API endpoint
export const createApiEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, httpMethod, path, description, parameters, querySuggestion } = req.body;

    // Check if endpoint with same method and path already exists for this user
    const existingEndpoint = await ApiEndpoint.findOne({
      where: {
        userId,
        httpMethod,
        path
      }
    });

    if (existingEndpoint) {
      return res.status(409).json({
        success: false,
        message: 'An endpoint with this method and path already exists'
      });
    }

    const endpoint = await ApiEndpoint.create({
      userId,
      name,
      httpMethod,
      path,
      description,
      parameters: parameters || [],
      querySuggestion
    });

    res.status(201).json({
      success: true,
      message: 'API endpoint created successfully',
      data: { endpoint }
    });
  } catch (error) {
    console.error('Create API endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create API endpoint'
    });
  }
};

// Update an API endpoint
export const updateApiEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, httpMethod, path, description, parameters, querySuggestion, status } = req.body;

    const endpoint = await ApiEndpoint.findByUserAndId(userId, id);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }

    // Check if updating to a method/path combination that already exists
    if (httpMethod && path && (httpMethod !== endpoint.httpMethod || path !== endpoint.path)) {
      const existingEndpoint = await ApiEndpoint.findOne({
        where: {
          userId,
          httpMethod,
          path,
          id: { [ApiEndpoint.sequelize.Sequelize.Op.ne]: id }
        }
      });

      if (existingEndpoint) {
        return res.status(409).json({
          success: false,
          message: 'An endpoint with this method and path already exists'
        });
      }
    }

    // Update endpoint
    await endpoint.update({
      ...(name && { name }),
      ...(httpMethod && { httpMethod }),
      ...(path && { path }),
      ...(description !== undefined && { description }),
      ...(parameters && { parameters }),
      ...(querySuggestion !== undefined && { querySuggestion }),
      ...(status && { status })
    });

    res.json({
      success: true,
      message: 'API endpoint updated successfully',
      data: { endpoint }
    });
  } catch (error) {
    console.error('Update API endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update API endpoint'
    });
  }
};

// Delete an API endpoint
export const deleteApiEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const endpoint = await ApiEndpoint.findByUserAndId(userId, id);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }

    await endpoint.destroy();

    res.json({
      success: true,
      message: 'API endpoint deleted successfully'
    });
  } catch (error) {
    console.error('Delete API endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete API endpoint'
    });
  }
};

// Get API endpoint usage statistics
export const getEndpointStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeRange = '24h' } = req.query;

    const stats = await ApiUsageLog.getUsageStats(userId, timeRange);
    const topEndpoints = await ApiUsageLog.getTopEndpoints(userId, 10);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalRequests: 0,
          avgResponseTime: 0,
          errorCount: 0
        },
        topEndpoints
      }
    });
  } catch (error) {
    console.error('Get endpoint stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve endpoint statistics'
    });
  }
};

// Test an API endpoint (mock execution)
export const testApiEndpoint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { parameters = {} } = req.body;

    const endpoint = await ApiEndpoint.findByUserAndId(userId, id);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }

    // Mock response generation based on endpoint configuration
    const mockResponse = generateMockResponse(endpoint, parameters);

    // Log the test execution
    await ApiUsageLog.create({
      userId,
      endpointId: endpoint.id,
      method: endpoint.httpMethod,
      path: endpoint.path,
      statusCode: mockResponse.statusCode,
      responseTime: mockResponse.responseTime,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'API endpoint test completed',
      data: mockResponse
    });
  } catch (error) {
    console.error('Test API endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test API endpoint'
    });
  }
};

// Helper function to generate mock responses
const generateMockResponse = (endpoint, parameters) => {
  const responseTime = Math.floor(Math.random() * 500) + 50; // 50-550ms
  
  let statusCode = 200;
  let data = {};

  switch (endpoint.httpMethod) {
    case 'GET':
      statusCode = 200;
      data = generateMockData(endpoint, parameters);
      break;
    case 'POST':
      statusCode = 201;
      data = {
        id: Math.floor(Math.random() * 1000) + 1,
        message: 'Resource created successfully',
        ...generateMockData(endpoint, parameters)
      };
      break;
    case 'PUT':
    case 'PATCH':
      statusCode = 200;
      data = {
        message: 'Resource updated successfully',
        ...generateMockData(endpoint, parameters)
      };
      break;
    case 'DELETE':
      statusCode = 204;
      data = null;
      break;
    default:
      statusCode = 200;
      data = generateMockData(endpoint, parameters);
  }

  return {
    statusCode,
    responseTime,
    data,
    headers: {
      'Content-Type': 'application/json',
      'X-Response-Time': `${responseTime}ms`,
      'X-Mock-Response': 'true'
    }
  };
};

// Helper function to generate mock data based on endpoint parameters
const generateMockData = (endpoint, parameters) => {
  const mockData = {};

  // Use provided parameters
  endpoint.parameters.forEach(param => {
    const value = parameters[param.name];
    if (value !== undefined) {
      switch (param.type) {
        case 'integer':
          mockData[param.name] = parseInt(value) || Math.floor(Math.random() * 1000);
          break;
        case 'number':
          mockData[param.name] = parseFloat(value) || Math.random() * 1000;
          break;
        case 'boolean':
          mockData[param.name] = value === 'true' || value === true;
          break;
        default:
          mockData[param.name] = value || `mock_${param.name}`;
      }
    }
  });

  // Add some common mock fields based on endpoint path
  if (endpoint.path.includes('user')) {
    mockData.id = mockData.id || Math.floor(Math.random() * 1000);
    mockData.email = mockData.email || 'user@example.com';
    mockData.name = mockData.name || 'John Doe';
    mockData.createdAt = new Date().toISOString();
  } else if (endpoint.path.includes('product')) {
    mockData.id = mockData.id || Math.floor(Math.random() * 1000);
    mockData.name = mockData.name || 'Sample Product';
    mockData.price = mockData.price || 29.99;
    mockData.category = mockData.category || 'Electronics';
  } else {
    mockData.id = mockData.id || Math.floor(Math.random() * 1000);
    mockData.timestamp = new Date().toISOString();
  }

  return mockData;
};