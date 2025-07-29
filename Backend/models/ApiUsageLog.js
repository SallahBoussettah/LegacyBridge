import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ApiUsageLog = sequelize.define('ApiUsageLog', {
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
  endpointId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'endpoint_id',
    references: {
      model: 'api_endpoints',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  method: {
    type: DataTypes.STRING(10),
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  statusCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'status_code',
  },
  responseTime: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'response_time',
    comment: 'Response time in milliseconds',
  },
  ipAddress: {
    type: DataTypes.INET,
    allowNull: true,
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
  },
}, {
  tableName: 'api_usage_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id'],
    },
    {
      fields: ['endpoint_id'],
    },
    {
      fields: ['created_at'],
    },
    {
      fields: ['status_code'],
    },
  ],
});

// Class methods
ApiUsageLog.getUsageStats = async function(userId, timeRange = '24h') {
  const timeRanges = {
    '1h': new Date(Date.now() - 60 * 60 * 1000),
    '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
    '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  };

  const since = timeRanges[timeRange] || timeRanges['24h'];

  return this.findAll({
    where: {
      userId,
      createdAt: {
        [sequelize.Sequelize.Op.gte]: since,
      },
    },
    attributes: [
      [sequelize.fn('COUNT', '*'), 'totalRequests'],
      [sequelize.fn('AVG', sequelize.col('response_time')), 'avgResponseTime'],
      [sequelize.fn('COUNT', sequelize.literal('CASE WHEN status_code >= 400 THEN 1 END')), 'errorCount'],
    ],
    raw: true,
  });
};

ApiUsageLog.getTopEndpoints = function(userId, limit = 10) {
  return this.findAll({
    where: { userId },
    attributes: [
      'path',
      'method',
      [sequelize.fn('COUNT', '*'), 'requestCount'],
      [sequelize.fn('AVG', sequelize.col('response_time')), 'avgResponseTime'],
    ],
    group: ['path', 'method'],
    order: [[sequelize.literal('requestCount'), 'DESC']],
    limit,
    raw: true,
  });
};

export default ApiUsageLog;