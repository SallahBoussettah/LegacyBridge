import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const RefreshToken = sequelize.define('RefreshToken', {
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
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'expires_at',
  },
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// Class methods
RefreshToken.findValidToken = function(token) {
  return this.findOne({
    where: {
      token,
      expiresAt: {
        [sequelize.Sequelize.Op.gt]: new Date(),
      },
    },
  });
};

RefreshToken.deleteExpiredTokens = async function() {
  return this.destroy({
    where: {
      expiresAt: {
        [sequelize.Sequelize.Op.lt]: new Date(),
      },
    },
  });
};

RefreshToken.deleteUserTokens = function(userId) {
  return this.destroy({
    where: { userId },
  });
};

export default RefreshToken;