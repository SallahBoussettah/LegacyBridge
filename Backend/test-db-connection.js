import { DatabaseConnection } from './models/index.js';

// Test database connection creation
async function testDatabaseConnection() {
  try {
    console.log('Testing database connection creation...');
    
    const testData = {
      userId: 1,
      name: 'Test Connection',
      type: 'postgresql',
      host: 'localhost',
      port: 5432,
      databaseName: 'testdb',
      username: 'testuser',
      password: 'testpassword',
      sslEnabled: false
    };
    
    console.log('Creating connection with data:', {
      ...testData,
      password: '***hidden***'
    });
    
    const connection = await DatabaseConnection.create(testData);
    
    console.log('Connection created successfully!');
    console.log('Connection ID:', connection.id);
    console.log('Password encrypted:', !!connection.passwordEncrypted);
    
    // Test decryption
    const decryptedPassword = connection.getDecryptedPassword();
    console.log('Decrypted password matches:', decryptedPassword === 'testpassword');
    
    // Clean up
    await connection.destroy();
    console.log('Test connection cleaned up');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDatabaseConnection();