import { DataTypes } from 'sequelize';
import crypto from 'crypto';
import sequelize from '../config/database.js';

// Encryption key - in production, this should be stored securely
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'your-32-character-secret-key-here-must-be-32-chars';
const ALGORITHM = 'aes-256-cbc';

// Encryption functions
const encryptPassword = (password) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt password');
  }
};

const decryptPassword = (encryptedPassword) => {
  try {
    const parts = encryptedPassword.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt password');
  }
};

const DatabaseConnection = sequelize.define('DatabaseConnection', {
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
        msg: 'Connection name must be between 3 and 255 characters',
      },
    },
  },
  type: {
    type: DataTypes.ENUM('postgresql', 'mysql', 'sqlite', 'oracle', 'sqlserver'),
    allowNull: false,
  },
  host: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  port: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 65535,
    },
  },
  databaseName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'database_name',
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  passwordEncrypted: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'password_encrypted',
  },
  sslEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'ssl_enabled',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'database_connections',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// Static methods for password encryption/decryption
DatabaseConnection.encryptPassword = encryptPassword;
DatabaseConnection.decryptPassword = decryptPassword;

// Instance methods
DatabaseConnection.prototype.getDecryptedPassword = function() {
  return decryptPassword(this.passwordEncrypted);
};

DatabaseConnection.prototype.testConnection = async function() {
  // This would implement actual database connection testing
  // For now, we'll return a mock response
  return {
    success: true,
    message: 'Connection test successful',
  };
};

// Class methods
DatabaseConnection.findByUser = function(userId) {
  return this.findAll({
    where: { userId },
    attributes: { exclude: ['passwordEncrypted'] },
    order: [['created_at', 'DESC']],
  });
};

DatabaseConnection.findActiveByUser = function(userId) {
  return this.findAll({
    where: { 
      userId,
      isActive: true,
    },
    attributes: { exclude: ['passwordEncrypted'] },
    order: [['created_at', 'DESC']],
  });
};

DatabaseConnection.findByUserAndId = function(userId, id) {
  return this.findOne({
    where: { 
      userId,
      id,
    },
  });
};

export default DatabaseConnection;