import { DatabaseConnection, sequelize } from '../models/index.js';
import databaseInspector from '../services/databaseInspector.js';

// Get all database connections for the authenticated user
export const getDatabaseConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { active } = req.query;

    let connections;
    if (active === 'true') {
      connections = await DatabaseConnection.findActiveByUser(userId);
    } else {
      connections = await DatabaseConnection.findByUser(userId);
    }

    res.json({
      success: true,
      data: { connections }
    });
  } catch (error) {
    console.error('Get database connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database connections'
    });
  }
};

// Get a specific database connection
export const getDatabaseConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await DatabaseConnection.findByUserAndId(userId, id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    // Remove sensitive data from response
    const connectionData = connection.toJSON();
    delete connectionData.passwordEncrypted;

    res.json({
      success: true,
      data: { connection: connectionData }
    });
  } catch (error) {
    console.error('Get database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database connection'
    });
  }
};

// Create a new database connection
export const createDatabaseConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, type, host, port, databaseName, username, password, sslEnabled } = req.body;

    console.log('Creating database connection with data:', {
      name, type, host, port, databaseName, username, 
      passwordExists: !!password, sslEnabled
    });

    // Check if connection with same name already exists for this user
    const existingConnection = await DatabaseConnection.findOne({
      where: {
        userId,
        name
      }
    });

    if (existingConnection) {
      return res.status(409).json({
        success: false,
        message: 'A database connection with this name already exists'
      });
    }

    console.log('About to create connection...');
    
    // Encrypt password before saving
    const encryptedPassword = DatabaseConnection.encryptPassword(password);
    console.log('Password encrypted successfully');
    
    const connection = await DatabaseConnection.create({
      userId,
      name,
      type,
      host,
      port,
      databaseName,
      username,
      passwordEncrypted: encryptedPassword,
      sslEnabled: sslEnabled || false
    });
    console.log('Connection created successfully');

    // Remove sensitive data from response
    const connectionData = connection.toJSON();
    delete connectionData.passwordEncrypted;

    res.status(201).json({
      success: true,
      message: 'Database connection created successfully',
      data: { connection: connectionData }
    });
  } catch (error) {
    console.error('Create database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create database connection'
    });
  }
};

// Update a database connection
export const updateDatabaseConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, type, host, port, databaseName, username, password, sslEnabled, isActive } = req.body;

    const connection = await DatabaseConnection.findByUserAndId(userId, id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    // Check if updating to a name that already exists
    if (name && name !== connection.name) {
      const existingConnection = await DatabaseConnection.findOne({
        where: {
          userId,
          name,
          id: { [sequelize.Sequelize.Op.ne]: id }
        }
      });

      if (existingConnection) {
        return res.status(409).json({
          success: false,
          message: 'A database connection with this name already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {
      ...(name && { name }),
      ...(type && { type }),
      ...(host && { host }),
      ...(port && { port }),
      ...(databaseName && { databaseName }),
      ...(username && { username }),
      ...(sslEnabled !== undefined && { sslEnabled }),
      ...(isActive !== undefined && { isActive })
    };

    // Encrypt password if provided
    if (password) {
      updateData.passwordEncrypted = DatabaseConnection.encryptPassword(password);
    }

    // Update connection
    await connection.update(updateData);

    // Remove sensitive data from response
    const connectionData = connection.toJSON();
    delete connectionData.passwordEncrypted;

    res.json({
      success: true,
      message: 'Database connection updated successfully',
      data: { connection: connectionData }
    });
  } catch (error) {
    console.error('Update database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update database connection'
    });
  }
};

// Delete a database connection
export const deleteDatabaseConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await DatabaseConnection.findByUserAndId(userId, id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    await connection.destroy();

    res.json({
      success: true,
      message: 'Database connection deleted successfully'
    });
  } catch (error) {
    console.error('Delete database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete database connection'
    });
  }
};

// Test a database connection
export const testDatabaseConnection = async (req, res) => {
  try {
    console.log('Testing database connection:', req.params.id, 'for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { id } = req.params;

    const connection = await DatabaseConnection.findByUserAndId(userId, id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    // Get decrypted password and test real connection
    const connectionConfig = {
      type: connection.type,
      host: connection.host,
      port: connection.port,
      databaseName: connection.databaseName,
      username: connection.username,
      password: connection.getDecryptedPassword(),
      sslEnabled: connection.sslEnabled
    };

    const testResult = await databaseInspector.testConnection(connectionConfig);

    console.log('Database connection test result:', testResult.success);

    res.json({
      success: true,
      message: 'Database connection test completed',
      data: testResult
    });
  } catch (error) {
    console.error('Test database connection error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to test database connection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get database schema (real implementation)
export const getDatabaseSchema = async (req, res) => {
  try {
    console.log('Getting database schema for connection:', req.params.id, 'user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { id } = req.params;

    const connection = await DatabaseConnection.findByUserAndId(userId, id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    // Get decrypted password and discover real schema
    const connectionConfig = {
      type: connection.type,
      host: connection.host,
      port: connection.port,
      databaseName: connection.databaseName,
      username: connection.username,
      password: connection.getDecryptedPassword(),
      sslEnabled: connection.sslEnabled
    };

    console.log('Discovering schema for database:', connectionConfig.databaseName);

    const schemaResult = await databaseInspector.discoverSchema(connectionConfig);

    if (!schemaResult.success) {
      return res.status(500).json({
        success: false,
        message: schemaResult.message
      });
    }

    console.log('Schema discovery completed. Found', schemaResult.data.tables.length, 'tables');

    res.json({
      success: true,
      data: { schema: schemaResult.data }
    });
  } catch (error) {
    console.error('Get database schema error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database schema',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Execute query against database
export const executeQuery = async (req, res) => {
  try {
    console.log('Executing query on database:', req.params.id, 'for user:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { query, parameters = [] } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'SQL query is required'
      });
    }

    // Basic security check - only allow SELECT queries for now
    const trimmedQuery = query.trim().toLowerCase();
    if (!trimmedQuery.startsWith('select')) {
      return res.status(400).json({
        success: false,
        message: 'Only SELECT queries are allowed for security reasons'
      });
    }

    const connection = await DatabaseConnection.findByUserAndId(userId, id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    // Get decrypted password and execute query
    const connectionConfig = {
      type: connection.type,
      host: connection.host,
      port: connection.port,
      databaseName: connection.databaseName,
      username: connection.username,
      password: connection.getDecryptedPassword(),
      sslEnabled: connection.sslEnabled
    };

    console.log('Executing query:', query.substring(0, 100) + '...');

    const queryResult = await databaseInspector.executeQuery(connectionConfig, query, parameters);

    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        message: queryResult.message
      });
    }

    console.log('Query executed successfully. Returned', queryResult.data.rowCount, 'rows');

    res.json({
      success: true,
      message: 'Query executed successfully',
      data: queryResult.data
    });
  } catch (error) {
    console.error('Execute query error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to execute query',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};