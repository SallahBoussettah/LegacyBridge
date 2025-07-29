import { syncDatabase, sequelize } from '../models/index.js';

const migrate = async () => {
  try {
    console.log('🚀 Starting database migration with Sequelize...');
    
    // Sync all models (create tables if they don't exist)
    await syncDatabase(false); // Set to true to drop and recreate tables
    
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('🔌 Database connection closed');
  }
};

migrate();