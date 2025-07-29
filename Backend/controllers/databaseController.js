import { DatabaseConnection } from '../models/index.js';

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

    const connection = await DatabaseConnection.create({
      userId,
      name,
      type,
      host,
      port,
      databaseName,
      username,
      password, // Will be encrypted by the model hook
      sslEnabled: sslEnabled || false
    });

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
          id: { [DatabaseConnection.sequelize.Sequelize.Op.ne]: id }
        }
      });

      if (existingConnection) {
        return res.status(409).json({
          success: false,
          message: 'A database connection with this name already exists'
        });
      }
    }

    // Update connection
    await connection.update({
      ...(name && { name }),
      ...(type && { type }),
      ...(host && { host }),
      ...(port && { port }),
      ...(databaseName && { databaseName }),
      ...(username && { username }),
      ...(password && { password }), // Will be encrypted by the model hook
      ...(sslEnabled !== undefined && { sslEnabled }),
      ...(isActive !== undefined && { isActive })
    });

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
    const userId = req.user.id;
    const { id } = req.params;

    const connection = await DatabaseConnection.findByUserAndId(userId, id);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Database connection not found'
      });
    }

    // Test the connection (mock implementation for now)
    const testResult = await connection.testConnection();

    res.json({
      success: true,
      message: 'Database connection test completed',
      data: testResult
    });
  } catch (error) {
    console.error('Test database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test database connection'
    });
  }
};

// Get database schema (mock implementation)
export const getDatabaseSchema = async (req, res) => {
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

    // Mock schema data - in real implementation, this would connect to the actual database
    const mockSchema = {
      tables: [
        {
          name: 'users',
          columns: [
            { name: 'id', type: 'integer', primaryKey: true },
            { name: 'email', type: 'varchar', nullable: false },
            { name: 'first_name', type: 'varchar', nullable: false },
            { name: 'last_name', type: 'varchar', nullable: false },
            { name: 'created_at', type: 'timestamp', nullable: false }
          ]
        },
        {
          name: 'products',
          columns: [
            { name: 'id', type: 'integer', primaryKey: true },
            { name: 'name', type: 'varchar', nullable: false },
            { name: 'price', type: 'decimal', nullable: false },
            { name: 'category', type: 'varchar', nullable: true },
            { name: 'created_at', type: 'timestamp', nullable: false }
          ]
        },
        {
          name: 'orders',
          columns: [
            { name: 'id', type: 'integer', primaryKey: true },
            { name: 'user_id', type: 'integer', nullable: false },
            { name: 'product_id', type: 'integer', nullable: false },
            { name: 'quantity', type: 'integer', nullable: false },
            { name: 'total_amount', type: 'decimal', nullable: false },
            { name: 'created_at', type: 'timestamp', nullable: false }
          ]
        }
      ]
    };

    res.json({
      success: true,
      data: { schema: mockSchema }
    });
  } catch (error) {
    console.error('Get database schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve database schema'
    });
  }
};