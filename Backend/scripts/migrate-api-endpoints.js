import { sequelize } from '../models/index.js';

/**
 * Migration script to add new columns to api_endpoints table
 */
async function migrateApiEndpoints() {
  try {
    console.log('🔄 Starting API endpoints migration...');

    // Add new columns to api_endpoints table
    const queries = [
      `ALTER TABLE api_endpoints 
       ADD COLUMN IF NOT EXISTS database_connection_id INTEGER 
       REFERENCES database_connections(id) ON DELETE SET NULL;`,
       
      `ALTER TABLE api_endpoints 
       ADD COLUMN IF NOT EXISTS validated_query TEXT;`,
       
      `ALTER TABLE api_endpoints 
       ADD COLUMN IF NOT EXISTS query_parameters JSONB DEFAULT '{}';`,
       
      `ALTER TABLE api_endpoints 
       ADD COLUMN IF NOT EXISTS execution_mode VARCHAR(20) DEFAULT 'mock' 
       CHECK (execution_mode IN ('mock', 'database'));`,
    ];

    for (const query of queries) {
      console.log('Executing:', query.split('\n')[0] + '...');
      await sequelize.query(query);
    }

    // Create indexes for better performance
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_api_endpoints_database_connection_id 
       ON api_endpoints(database_connection_id);`,
       
      `CREATE INDEX IF NOT EXISTS idx_api_endpoints_execution_mode 
       ON api_endpoints(execution_mode);`,
    ];

    for (const query of indexQueries) {
      console.log('Creating index:', query.split('\n')[0] + '...');
      await sequelize.query(query);
    }

    console.log('✅ API endpoints migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateApiEndpoints()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export default migrateApiEndpoints;