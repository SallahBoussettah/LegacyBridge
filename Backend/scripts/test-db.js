import { sequelize, User, ApiEndpoint } from '../models/index.js';

const testDatabase = async () => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    
    // Test User model
    const userCount = await User.count();
    console.log(`👥 Users in database: ${userCount}`);
    
    // Test ApiEndpoint model
    const endpointCount = await ApiEndpoint.count();
    console.log(`🔗 API endpoints in database: ${endpointCount}`);
    
    // List all tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Database tables:', tables);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

testDatabase();