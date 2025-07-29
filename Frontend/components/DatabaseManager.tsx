import React, { useState, useEffect } from 'react';
import { Button } from './common/Button';
import { Card, CardContent, CardHeader } from './common/Card';
import { Modal } from './common/Modal';
import apiService from '../services/apiService';

interface DatabaseConnection {
  id: string;
  name: string;
  type: 'mysql' | 'postgresql';
  host: string;
  port: number;
  databaseName: string;
  username: string;
  isActive: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  database: string;
  type: string;
  tables: Array<{
    name: string;
    rowCount: number;
    columns: Array<{
      name: string;
      type: string;
      nullable: boolean;
      isPrimaryKey: boolean;
      isAutoIncrement: boolean;
    }>;
    foreignKeys: Array<{
      columnName: string;
      referencedTable: string;
      referencedColumn: string;
    }>;
  }>;
}

export const DatabaseManager: React.FC = () => {
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  // Form state for new connection
  const [formData, setFormData] = useState({
    name: '',
    type: 'mysql' as 'mysql' | 'postgresql',
    host: 'localhost',
    port: 3306,
    databaseName: '',
    username: '',
    password: '',
    sslEnabled: false
  });

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getDatabaseConnections();
      
      if (response.success && response.data) {
        setConnections(response.data.connections);
      } else {
        setError(response.message || 'Failed to fetch database connections');
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await apiService.createDatabaseConnection(formData);
      
      if (response.success) {
        await fetchConnections();
        setIsModalOpen(false);
        resetForm();
      } else {
        setError(response.message || 'Failed to create connection');
      }
    } catch (error) {
      console.error('Error creating connection:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleTestConnection = async (connectionId: string) => {
    try {
      setTestResults(prev => ({ ...prev, [connectionId]: { loading: true } }));
      
      const response = await apiService.testDatabaseConnection(connectionId);
      
      setTestResults(prev => ({
        ...prev,
        [connectionId]: {
          loading: false,
          success: response.success,
          data: response.data
        }
      }));
    } catch (error) {
      console.error('Error testing connection:', error);
      setTestResults(prev => ({
        ...prev,
        [connectionId]: {
          loading: false,
          success: false,
          error: 'Test failed'
        }
      }));
    }
  };

  const handleViewSchema = async (connection: DatabaseConnection) => {
    try {
      setSelectedConnection(connection);
      setIsSchemaLoading(true);
      setSchema(null);
      
      const response = await apiService.getDatabaseSchema(connection.id);
      
      if (response.success && response.data) {
        setSchema(response.data.schema);
      } else {
        setError(response.message || 'Failed to fetch schema');
      }
    } catch (error) {
      console.error('Error fetching schema:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSchemaLoading(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    if (!confirm('Are you sure you want to delete this database connection?')) {
      return;
    }

    try {
      const response = await apiService.deleteDatabaseConnection(connectionId);
      
      if (response.success) {
        await fetchConnections();
      } else {
        setError(response.message || 'Failed to delete connection');
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      setError('An unexpected error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      databaseName: '',
      username: '',
      password: '',
      sslEnabled: false
    });
  };

  const getConnectionIcon = (type: string) => {
    switch (type) {
      case 'mysql':
        return '🐬';
      case 'postgresql':
        return '🐘';
      default:
        return '🗄️';
    }
  };

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'mysql':
        return 'bg-orange-100 text-orange-800';
      case 'postgresql':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Database Connections</h2>
          <p className="text-lg text-slate-600">
            Connect to your legacy databases to generate APIs automatically.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          Add Database Connection
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 text-sm mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading database connections...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.map((connection) => (
            <Card key={connection.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getConnectionIcon(connection.type)}</span>
                    <div>
                      <h3 className="font-semibold text-slate-800">{connection.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConnectionColor(connection.type)}`}>
                        {connection.type.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    connection.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {connection.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p><strong>Host:</strong> {connection.host}:{connection.port}</p>
                  <p><strong>Database:</strong> {connection.databaseName}</p>
                  <p><strong>Username:</strong> {connection.username}</p>
                </div>

                {testResults[connection.id] && (
                  <div className={`p-3 rounded-lg text-sm ${
                    testResults[connection.id].success 
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {testResults[connection.id].loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="loading-spinner"></div>
                        <span>Testing connection...</span>
                      </div>
                    ) : testResults[connection.id].success ? (
                      <div>
                        ✅ Connection successful
                        {testResults[connection.id].data?.serverInfo && (
                          <div className="mt-1 text-xs">
                            {testResults[connection.id].data.serverInfo.type} {testResults[connection.id].data.serverInfo.version}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>❌ Connection failed</div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleTestConnection(connection.id)}
                    disabled={testResults[connection.id]?.loading}
                  >
                    Test
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleViewSchema(connection)}
                  >
                    Schema
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDeleteConnection(connection.id)}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {connections.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🗄️</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">No Database Connections</h3>
          <p className="text-slate-600 mb-4">
            Connect to your legacy databases to start generating APIs automatically.
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            Add Your First Database
          </Button>
        </div>
      )}

      {/* Add Connection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Add Database Connection"
      >
        <form onSubmit={handleCreateConnection} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Connection Name
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Production MySQL"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Database Type
            </label>
            <select
              className="input-field"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                type: e.target.value as 'mysql' | 'postgresql',
                port: e.target.value === 'mysql' ? 3306 : 5432
              }))}
            >
              <option value="mysql">MySQL</option>
              <option value="postgresql">PostgreSQL</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Host
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.host}
                onChange={(e) => setFormData(prev => ({ ...prev, host: e.target.value }))}
                placeholder="localhost"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Port
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.port}
                onChange={(e) => setFormData(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Database Name
            </label>
            <input
              type="text"
              className="input-field"
              value={formData.databaseName}
              onChange={(e) => setFormData(prev => ({ ...prev, databaseName: e.target.value }))}
              placeholder="my_database"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username
              </label>
              <input
                type="text"
                className="input-field"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="db_user"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="sslEnabled"
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-slate-300 rounded"
              checked={formData.sslEnabled}
              onChange={(e) => setFormData(prev => ({ ...prev, sslEnabled: e.target.checked }))}
            />
            <label htmlFor="sslEnabled" className="ml-2 block text-sm text-slate-700">
              Enable SSL/TLS
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Connection
            </Button>
          </div>
        </form>
      </Modal>

      {/* Schema Modal */}
      {selectedConnection && (
        <Modal
          isOpen={!!selectedConnection}
          onClose={() => {
            setSelectedConnection(null);
            setSchema(null);
          }}
          title={`Database Schema: ${selectedConnection.name}`}
          size="large"
        >
          <div className="space-y-4">
            {isSchemaLoading ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-slate-600">Discovering database schema...</p>
              </div>
            ) : schema ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-800 mb-2">Database Information</h4>
                  <p><strong>Name:</strong> {schema.database}</p>
                  <p><strong>Type:</strong> {schema.type}</p>
                  <p><strong>Tables:</strong> {schema.tables.length}</p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {schema.tables.map((table, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-slate-800">{table.name}</h5>
                        <span className="text-sm text-slate-500">
                          {table.rowCount?.toLocaleString() || 'Unknown'} rows
                        </span>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-slate-700">Column</th>
                              <th className="px-3 py-2 text-left font-medium text-slate-700">Type</th>
                              <th className="px-3 py-2 text-left font-medium text-slate-700">Nullable</th>
                              <th className="px-3 py-2 text-left font-medium text-slate-700">Key</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {table.columns.map((column, colIndex) => (
                              <tr key={colIndex}>
                                <td className="px-3 py-2 font-mono text-slate-800">{column.name}</td>
                                <td className="px-3 py-2 text-slate-600">{column.type}</td>
                                <td className="px-3 py-2">
                                  {column.nullable ? (
                                    <span className="text-yellow-600">Yes</span>
                                  ) : (
                                    <span className="text-green-600">No</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {column.isPrimaryKey && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">PK</span>
                                  )}
                                  {column.isAutoIncrement && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs ml-1">AI</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {table.foreignKeys && table.foreignKeys.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <h6 className="font-medium text-slate-700 mb-2">Foreign Keys</h6>
                          <div className="space-y-1">
                            {table.foreignKeys.map((fk, fkIndex) => (
                              <div key={fkIndex} className="text-sm text-slate-600">
                                <code className="bg-slate-100 px-1 rounded">{fk.columnName}</code>
                                {' → '}
                                <code className="bg-slate-100 px-1 rounded">{fk.referencedTable}.{fk.referencedColumn}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600">Failed to load schema</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};