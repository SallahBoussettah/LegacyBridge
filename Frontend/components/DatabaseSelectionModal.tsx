import React, { useState, useEffect } from 'react';
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import apiService from '../services/apiService';

interface DatabaseConnection {
  id: string;
  name: string;
  type: string;
  host: string;
  port: number;
  databaseName: string;
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

interface DatabaseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: 'mock' | 'database', databaseId?: string, schema?: DatabaseSchema) => void;
}

export const DatabaseSelectionModal: React.FC<DatabaseSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [executionMode, setExecutionMode] = useState<'mock' | 'database'>('mock');
  const [databaseConnections, setDatabaseConnections] = useState<DatabaseConnection[]>([]);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>('');
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load database connections when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDatabaseConnections();
    }
  }, [isOpen]);

  // Load schema when database is selected
  useEffect(() => {
    if (selectedDatabaseId && executionMode === 'database') {
      fetchDatabaseSchema(selectedDatabaseId);
    } else {
      setSchema(null);
    }
  }, [selectedDatabaseId, executionMode]);

  const fetchDatabaseConnections = async () => {
    try {
      setIsLoadingConnections(true);
      setError(null);
      
      const response = await apiService.getDatabaseConnections(true);
      if (response.success && response.data) {
        setDatabaseConnections(response.data.connections);
      } else {
        setError('Failed to load database connections');
      }
    } catch (error) {
      console.error('Error fetching database connections:', error);
      setError('Failed to load database connections');
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const fetchDatabaseSchema = async (databaseId: string) => {
    try {
      setIsLoadingSchema(true);
      setError(null);
      
      const response = await apiService.getDatabaseSchema(databaseId);
      if (response.success && response.data) {
        setSchema(response.data.schema);
      } else {
        setError('Failed to load database schema');
        setSchema(null);
      }
    } catch (error) {
      console.error('Error fetching database schema:', error);
      setError('Failed to load database schema');
      setSchema(null);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  const handleConfirm = () => {
    if (executionMode === 'database' && !selectedDatabaseId) {
      setError('Please select a database connection');
      return;
    }

    onConfirm(executionMode, selectedDatabaseId || undefined, schema || undefined);
    handleClose();
  };

  const handleClose = () => {
    setExecutionMode('mock');
    setSelectedDatabaseId('');
    setSchema(null);
    setError(null);
    onClose();
  };

  const selectedDatabase = databaseConnections.find(db => db.id === selectedDatabaseId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🤖 AI API Generation Setup"
      size="large"
    >
      <div className="space-y-6">
        {/* Introduction */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <h4 className="font-semibold text-blue-800 mb-2">🎯 Choose Your Generation Mode</h4>
          <p className="text-blue-700 text-sm">
            Select how you want the AI to generate your API. For real-world APIs, choose a database connection 
            so the AI can understand your actual data structure and create more accurate endpoints.
          </p>
        </div>

        {/* Execution Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Generation Mode
          </label>
          <div className="space-y-3">
            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                name="executionMode"
                value="mock"
                checked={executionMode === 'mock'}
                onChange={(e) => setExecutionMode(e.target.value as 'mock' | 'database')}
                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-slate-300 mt-1"
              />
              <div className="ml-3">
                <div className="font-medium text-slate-900">🎭 Mock Data (Quick Testing)</div>
                <div className="text-sm text-slate-600 mt-1">
                  Generate APIs with sample data for rapid prototyping and testing. 
                  Perfect for exploring ideas without connecting to real databases.
                </div>
              </div>
            </label>
            
            <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="radio"
                name="executionMode"
                value="database"
                checked={executionMode === 'database'}
                onChange={(e) => setExecutionMode(e.target.value as 'mock' | 'database')}
                className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-slate-300 mt-1"
              />
              <div className="ml-3">
                <div className="font-medium text-slate-900">🗄️ Real Database (Production Ready)</div>
                <div className="text-sm text-slate-600 mt-1">
                  AI analyzes your actual database schema to generate precise APIs with real data. 
                  Creates production-ready endpoints that work with your legacy systems.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Database Selection */}
        {executionMode === 'database' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Database Connection
              </label>
              
              {isLoadingConnections ? (
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                  <div className="loading-spinner"></div>
                  <span className="text-slate-600">Loading database connections...</span>
                </div>
              ) : databaseConnections.length > 0 ? (
                <select
                  value={selectedDatabaseId}
                  onChange={(e) => setSelectedDatabaseId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Choose a database connection</option>
                  {databaseConnections.map((conn) => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type.toUpperCase()}) - {conn.databaseName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <div className="font-medium mb-1">No database connections available</div>
                  <div>You need to create a database connection first to use this mode.</div>
                  <button
                    onClick={() => window.location.hash = '#databases'}
                    className="text-amber-700 underline hover:text-amber-800 mt-2 inline-block"
                  >
                    Go to Database Manager →
                  </button>
                </div>
              )}
            </div>

            {/* Database Schema Preview */}
            {selectedDatabaseId && (
              <div className="border rounded-lg p-4 bg-slate-50">
                <h4 className="font-medium text-slate-800 mb-3">📊 Database Schema Analysis</h4>
                
                {isLoadingSchema ? (
                  <div className="flex items-center space-x-2">
                    <div className="loading-spinner"></div>
                    <span className="text-slate-600">Analyzing database schema...</span>
                  </div>
                ) : schema ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-slate-700">Database:</span>
                        <span className="ml-2 text-slate-600">{schema.database}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Type:</span>
                        <span className="ml-2 text-slate-600">{schema.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Tables:</span>
                        <span className="ml-2 text-slate-600">{schema.tables.length}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Total Columns:</span>
                        <span className="ml-2 text-slate-600">
                          {schema.tables.reduce((acc, table) => acc + table.columns.length, 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-medium text-slate-700 mb-2">Available Tables:</div>
                      <div className="flex flex-wrap gap-2">
                        {schema.tables.slice(0, 8).map((table) => (
                          <span
                            key={table.name}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {table.name} ({table.columns.length} cols)
                          </span>
                        ))}
                        {schema.tables.length > 8 && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            +{schema.tables.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <div className="text-green-600">✅</div>
                        <div className="text-sm text-green-700">
                          <strong>Schema loaded successfully!</strong> The AI will now generate APIs based on your actual database structure.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    Failed to load database schema. Please check your database connection.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Button
            variant="secondary"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={
              (executionMode === 'database' && !selectedDatabaseId) ||
              (executionMode === 'database' && selectedDatabaseId && isLoadingSchema)
            }
            className="shadow-brand"
          >
            {executionMode === 'database' && isLoadingSchema
              ? 'Loading Schema...'
              : 'Continue with AI Generation'
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};