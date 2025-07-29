import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ApiEndpoint = sequelize.define('ApiEndpoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [3, 255],
        msg: 'API name must be between 3 and 255 characters',
      },
    },
  },
  httpMethod: {
    type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
    allowNull: false,
    field: 'http_method',
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      isValidPath(value) {
        if (!value.startsWith('/')) {
          throw new Error('Path must start with /');
        }
        if (!/^[a-zA-Z0-9/_{}.-]*$/.test(value)) {
          throw new Error('Path contains invalid characters');
        }
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parameters: {
    type: DataTypes.JSONB,
    defaultValue: [],
    validate: {
      isValidParameters(value) {
        if (!Array.isArray(value)) {
          throw new Error('Parameters must be an array');
        }
        for (const param of value) {
          if (!param.name || !param.type || !param.description) {
            throw new Error('Each parameter must have name, type, and description');
          }
        }
      },
    },
  },
  querySuggestion: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'query_suggestion',
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active',
  },
}, {
  tableName: 'api_endpoints',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['status'],
    },
    {
      fields: ['http_method', 'path'],
    },
  ],
});

// Class methods
ApiEndpoint.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: { userId },
    ...options,
  });
};

ApiEndpoint.findActiveByUser = function(userId) {
  return this.findAll({
    where: { 
      userId,
      status: 'active',
    },
    order: [['created_at', 'DESC']],
  });
};

ApiEndpoint.findByUserAndId = function(userId, id) {
  return this.findOne({
    where: { 
      userId,
      id,
    },
  });
};

export default ApiEndpoint;