import sequelize from '../config/database.js';
import User from './User.js';
import RefreshToken from './RefreshToken.js';
import ApiEndpoint from './ApiEndpoint.js';
import ApiUsageLog from './ApiUsageLog.js';
import DatabaseConnection from './DatabaseConnection.js';

// Define associations
User.hasMany(RefreshToken, {
  foreignKey: 'userId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

RefreshToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(ApiEndpoint, {
  foreignKey: 'userId',
  as: 'apiEndpoints',
  onDelete: 'CASCADE',
});

ApiEndpoint.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

User.hasMany(ApiUsageLog, {
  foreignKey: 'userId',
  as: 'usageLogs',
  onDelete: 'CASCADE',
});

ApiUsageLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

ApiEndpoint.hasMany(ApiUsageLog, {
  foreignKey: 'endpointId',
  as: 'usageLogs',
  onDelete: 'CASCADE',
});

ApiUsageLog.belongsTo(ApiEndpoint, {
  foreignKey: 'endpointId',
  as: 'endpoint',
});

User.hasMany(DatabaseConnection, {
  foreignKey: 'userId',
  as: 'databaseConnections',
  onDelete: 'CASCADE',
});

DatabaseConnection.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// ApiEndpoint and DatabaseConnection relationship
ApiEndpoint.belongsTo(DatabaseConnection, {
  foreignKey: 'databaseConnectionId',
  as: 'databaseConnection',
});

DatabaseConnection.hasMany(ApiEndpoint, {
  foreignKey: 'databaseConnectionId',
  as: 'apiEndpoints',
  onDelete: 'SET NULL',
});

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ Database synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
};

// Export models and database instance
export {
  sequelize,
  User,
  RefreshToken,
  ApiEndpoint,
  ApiUsageLog,
  DatabaseConnection,
  syncDatabase,
};

export default {
  sequelize,
  User,
  RefreshToken,
  ApiEndpoint,
  ApiUsageLog,
  DatabaseConnection,
  syncDatabase,
};