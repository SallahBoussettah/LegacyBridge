import databaseInspector from './databaseInspector.js';

/**
 * Query Execution Service
 * Safely executes SQL queries against connected databases
 */
class QueryExecutor {
  
  constructor() {
    this.maxExecutionTime = 30000; // 30 seconds
    this.maxResultRows = 1000; // Maximum rows to return
    this.allowedStatements = ['SELECT']; // Only allow SELECT statements
  }

  /**
   * Execute API endpoint query with parameters
   */
  async executeEndpointQuery(apiEndpoint, parameters = {}) {
    try {
      console.log('Executing endpoint query:', apiEndpoint.id, 'Mode:', apiEndpoint.executionMode);

      // If endpoint is in mock mode, return mock data
      if (apiEndpoint.executionMode === 'mock' || !apiEndpoint.databaseConnection) {
        return this.generateMockResponse(apiEndpoint, parameters);
      }

      // Validate that we have a database connection
      if (!apiEndpoint.databaseConnection) {
        throw new Error('No database connection configured for this endpoint');
      }

      // Get the query to execute
      const query = apiEndpoint.validatedQuery || apiEndpoint.querySuggestion;
      if (!query) {
        throw new Error('No query configured for this endpoint');
      }

      // Validate query safety
      this.validateQuery(query);

      // Prepare connection config
      const connectionConfig = {
        type: apiEndpoint.databaseConnection.type,
        host: apiEndpoint.databaseConnection.host,
        port: apiEndpoint.databaseConnection.port,
        databaseName: apiEndpoint.databaseConnection.databaseName,
        username: apiEndpoint.databaseConnection.username,
        password: apiEndpoint.databaseConnection.getDecryptedPassword(),
        sslEnabled: apiEndpoint.databaseConnection.sslEnabled
      };

      // Process parameters and bind them to query
      const { processedQuery, boundParameters } = this.processQueryParameters(query, parameters, apiEndpoint.parameters);

      console.log('Executing query:', processedQuery.substring(0, 100) + '...');
      console.log('Parameters:', boundParameters);

      // Execute query with timeout
      const startTime = Date.now();
      const result = await Promise.race([
        databaseInspector.executeQuery(connectionConfig, processedQuery, boundParameters),
        this.createTimeout()
      ]);

      if (!result.success) {
        throw new Error(result.message);
      }

      const executionTime = Date.now() - startTime;

      // Limit result size
      let rows = result.data.rows;
      let truncated = false;
      if (rows.length > this.maxResultRows) {
        rows = rows.slice(0, this.maxResultRows);
        truncated = true;
      }

      return {
        success: true,
        data: {
          rows,
          rowCount: result.data.rowCount,
          executionTime,
          truncated,
          query: processedQuery,
          parameters: boundParameters
        }
      };

    } catch (error) {
      console.error('Query execution error:', error);
      return {
        success: false,
        message: this.formatErrorMessage(error.message),
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      };
    }
  }

  /**
   * Validate query for security
   */
  validateQuery(query) {
    const trimmedQuery = query.trim().toLowerCase();
    
    // Check if query starts with allowed statement
    const isAllowed = this.allowedStatements.some(stmt => 
      trimmedQuery.startsWith(stmt.toLowerCase())
    );

    if (!isAllowed) {
      throw new Error(`Only ${this.allowedStatements.join(', ')} statements are allowed`);
    }

    // Check for dangerous keywords
    const dangerousKeywords = [
      'drop', 'delete', 'insert', 'update', 'alter', 'create',
      'truncate', 'exec', 'execute', 'sp_', 'xp_'
    ];

    for (const keyword of dangerousKeywords) {
      if (trimmedQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`);
      }
    }

    // Check for comment-based SQL injection attempts
    if (trimmedQuery.includes('--') || trimmedQuery.includes('/*')) {
      throw new Error('Comments are not allowed in queries');
    }
  }

  /**
   * Process query parameters and bind them safely
   */
  processQueryParameters(query, userParameters, endpointParameters) {
    let processedQuery = query;
    const boundParameters = [];
    const parameterMap = {};

    // Create parameter mapping
    endpointParameters.forEach((param, index) => {
      const userValue = userParameters[param.name];
      if (userValue !== undefined) {
        // Validate parameter type
        const validatedValue = this.validateParameterType(userValue, param.type);
        parameterMap[param.name] = validatedValue;
        boundParameters.push(validatedValue);
      }
    });

    // Replace parameter placeholders in query
    // Support both {paramName} and $1, $2, etc. formats
    let paramIndex = 1;
    processedQuery = processedQuery.replace(/\{(\w+)\}/g, (match, paramName) => {
      if (parameterMap.hasOwnProperty(paramName)) {
        return `$${paramIndex++}`;
      }
      return match;
    });

    return { processedQuery, boundParameters };
  }

  /**
   * Validate parameter type and convert if necessary
   */
  validateParameterType(value, expectedType) {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return String(value);
      case 'integer':
        const intValue = parseInt(value);
        if (isNaN(intValue)) {
          throw new Error(`Parameter must be an integer, got: ${value}`);
        }
        return intValue;
      case 'number':
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          throw new Error(`Parameter must be a number, got: ${value}`);
        }
        return numValue;
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new Error(`Parameter must be a boolean, got: ${value}`);
      default:
        return String(value);
    }
  }

  /**
   * Create timeout promise
   */
  createTimeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Query execution timeout after ${this.maxExecutionTime / 1000} seconds`));
      }, this.maxExecutionTime);
    });
  }

  /**
   * Format error message for user display
   */
  formatErrorMessage(error) {
    // Common database errors and user-friendly messages
    const errorMappings = {
      'connection refused': 'Unable to connect to database. Please check connection settings.',
      'authentication failed': 'Database authentication failed. Please check credentials.',
      'does not exist': 'Referenced table or column does not exist in the database.',
      'syntax error': 'SQL query has syntax errors. Please check the query structure.',
      'timeout': 'Query execution took too long and was cancelled.',
      'permission denied': 'Insufficient database permissions to execute this query.'
    };

    const lowerError = error.toLowerCase();
    for (const [key, message] of Object.entries(errorMappings)) {
      if (lowerError.includes(key)) {
        return message;
      }
    }

    return 'Database query failed. Please check your query and try again.';
  }

  /**
   * Generate mock response for endpoints without database connections
   */
  generateMockResponse(endpoint, parameters) {
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

    return {
      success: true,
      data: {
        rows: [mockData],
        rowCount: 1,
        executionTime: Math.floor(Math.random() * 100) + 50,
        truncated: false,
        isMock: true
      }
    };
  }

  /**
   * Validate query against database schema
   */
  async validateQueryAgainstSchema(query, connectionConfig) {
    try {
      // This would implement schema validation
      // For now, we'll do basic validation
      const schemaResult = await databaseInspector.discoverSchema(connectionConfig);
      
      if (!schemaResult.success) {
        throw new Error('Unable to validate query against database schema');
      }

      // Extract table names from query
      const tableNames = this.extractTableNames(query);
      const availableTables = schemaResult.data.tables.map(t => t.name.toLowerCase());

      // Check if all referenced tables exist
      for (const tableName of tableNames) {
        if (!availableTables.includes(tableName.toLowerCase())) {
          throw new Error(`Table '${tableName}' does not exist in the database`);
        }
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Extract table names from SQL query (basic implementation)
   */
  extractTableNames(query) {
    const tableNames = [];
    const fromRegex = /from\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    const joinRegex = /join\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi;
    
    let match;
    while ((match = fromRegex.exec(query)) !== null) {
      tableNames.push(match[1]);
    }
    while ((match = joinRegex.exec(query)) !== null) {
      tableNames.push(match[1]);
    }
    
    return [...new Set(tableNames)]; // Remove duplicates
  }
}

export default new QueryExecutor();