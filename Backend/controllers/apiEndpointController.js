import { ApiEndpoint, ApiUsageLog, DatabaseConnection, sequelize } from '../models/index.js';
import queryExecutor from '../services/queryExecutor.js';

// Get all API endpoints for the authenticated user
export const getApiEndpoints = async (req, res) => {
  try {
    console.log('Getting API endpoints for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    console.log('Query parameters:', { userId, status, limit, offset });
    console.log('Where clause:', whereClause);

    const endpoints = await ApiEndpoint.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [{
        model: DatabaseConnection,
        as: 'databaseConnection',
        attributes: ['id', 'name', 'type'],
        required: false
      }],
      raw: false
    });

    console.log('Found endpoints:', endpoints.length);

    const total = await ApiEndpoint.count({ where: whereClause });

    console.log('Total count:', total);

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
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API endpoints',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get a specific API endpoint
export const getApiEndpoint = async (req, res) => {
  try {
    console.log('Getting API endpoint:', req.params.id, 'for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid endpoint ID is required'
      });
    }

    const endpoint = await ApiEndpoint.findByUserAndId(userId, id);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }

    console.log('Found API endpoint:', endpoint.id);

    res.json({
      success: true,
      data: { endpoint }
    });
  } catch (error) {
    console.error('Get API endpoint error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API endpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create a new API endpoint
export const createApiEndpoint = async (req, res) => {
  try {
    console.log('Creating API endpoint for user:', req.user?.id);
    console.log('Request body:', req.body);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { name, httpMethod, path, description, parameters, querySuggestion, databaseConnectionId, executionMode } = req.body;

    // Validate required fields
    if (!name || !httpMethod || !path) {
      return res.status(400).json({
        success: false,
        message: 'Name, HTTP method, and path are required'
      });
    }

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

    // Validate database connection if provided
    if (databaseConnectionId) {
      const dbConnection = await DatabaseConnection.findByUserAndId(userId, databaseConnectionId);
      if (!dbConnection) {
        return res.status(400).json({
          success: false,
          message: 'Invalid database connection ID'
        });
      }
    }

    const endpoint = await ApiEndpoint.create({
      userId,
      name,
      httpMethod,
      path,
      description: description || '',
      parameters: parameters || [],
      querySuggestion: querySuggestion || '',
      databaseConnectionId: databaseConnectionId || null,
      executionMode: executionMode || 'mock',
      validatedQuery: querySuggestion || '' // Initially use the suggestion as validated query
    });

    console.log('API endpoint created successfully:', endpoint.id);

    res.status(201).json({
      success: true,
      message: 'API endpoint created successfully',
      data: { endpoint }
    });
  } catch (error) {
    console.error('Create API endpoint error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create API endpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update an API endpoint
export const updateApiEndpoint = async (req, res) => {
  try {
    console.log('Updating API endpoint:', req.params.id, 'for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

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
          id: { [sequelize.Sequelize.Op.ne]: id }
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

    console.log('API endpoint updated successfully');

    res.json({
      success: true,
      message: 'API endpoint updated successfully',
      data: { endpoint }
    });
  } catch (error) {
    console.error('Update API endpoint error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to update API endpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete an API endpoint
export const deleteApiEndpoint = async (req, res) => {
  try {
    console.log('Deleting API endpoint:', req.params.id, 'for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid endpoint ID is required'
      });
    }

    const endpoint = await ApiEndpoint.findByUserAndId(userId, id);

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }

    await endpoint.destroy();

    console.log('API endpoint deleted successfully:', id);

    res.json({
      success: true,
      message: 'API endpoint deleted successfully'
    });
  } catch (error) {
    console.error('Delete API endpoint error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to delete API endpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get API endpoint usage statistics
export const getEndpointStats = async (req, res) => {
  try {
    console.log('Getting endpoint stats for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { timeRange = '24h' } = req.query;

    console.log('Stats query parameters:', { userId, timeRange });

    let stats = null;
    let topEndpoints = [];

    try {
      // Try to get usage stats, but don't fail if the table doesn't exist or is empty
      const statsResult = await ApiUsageLog.getUsageStats(userId, timeRange);
      stats = statsResult && statsResult.length > 0 ? statsResult[0] : null;
      console.log('Stats result:', stats);
    } catch (statsError) {
      console.warn('Failed to get usage stats:', statsError.message);
      stats = null;
    }

    try {
      // Try to get top endpoints, but don't fail if the table doesn't exist or is empty
      topEndpoints = await ApiUsageLog.getTopEndpoints(userId, 10);
      console.log('Top endpoints result:', topEndpoints);
    } catch (topEndpointsError) {
      console.warn('Failed to get top endpoints:', topEndpointsError.message);
      topEndpoints = [];
    }

    res.json({
      success: true,
      data: {
        stats: stats || {
          totalRequests: 0,
          avgResponseTime: 0,
          errorCount: 0
        },
        topEndpoints: topEndpoints || []
      }
    });
  } catch (error) {
    console.error('Get endpoint stats error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve endpoint statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Test an API endpoint (real or mock execution)
export const testApiEndpoint = async (req, res) => {
  try {
    console.log('Testing API endpoint:', req.params.id, 'for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { parameters = {} } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'Valid endpoint ID is required'
      });
    }

    // Get endpoint with database connection
    const endpoint = await ApiEndpoint.findOne({
      where: { userId, id },
      include: [{
        model: DatabaseConnection,
        as: 'databaseConnection',
        required: false
      }]
    });

    if (!endpoint) {
      return res.status(404).json({
        success: false,
        message: 'API endpoint not found'
      });
    }

    console.log('Endpoint execution mode:', endpoint.executionMode);

    // Execute query using the query executor
    const executionResult = await queryExecutor.executeEndpointQuery(endpoint, parameters);

    let statusCode = 200;
    let responseTime = 0;

    if (executionResult.success) {
      responseTime = executionResult.data.executionTime || 0;
      statusCode = 200;
    } else {
      statusCode = 400; // Bad request for query errors
    }

    // Log the test execution
    try {
      await ApiUsageLog.create({
        userId,
        endpointId: endpoint.id,
        method: endpoint.httpMethod,
        path: endpoint.path,
        statusCode,
        responseTime,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (logError) {
      console.warn('Failed to log API usage:', logError.message);
    }

    if (executionResult.success) {
      res.json({
        success: true,
        message: 'API endpoint test completed',
        data: {
          ...executionResult.data,
          endpoint: {
            id: endpoint.id,
            name: endpoint.name,
            method: endpoint.httpMethod,
            path: endpoint.path,
            executionMode: endpoint.executionMode
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: executionResult.message,
        error: executionResult.error
      });
    }
  } catch (error) {
    console.error('Test API endpoint error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to test API endpoint',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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