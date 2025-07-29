import React, { useState } from 'react';
import type { ApiEndpoint } from '../types';
import { Button } from './common/Button';
import { Card, CardContent, CardHeader } from './common/Card';
import { CheckIcon, XIcon, PlusIcon, TrashIcon } from './icons';

interface ApiEditorProps {
  config: Omit<ApiEndpoint, 'id' | 'status'>;
  onSave: (config: Omit<ApiEndpoint, 'id' | 'status'>) => void;
  onCancel: () => void;
}

export const ApiEditor: React.FC<ApiEditorProps> = ({ config, onSave, onCancel }) => {
  const [editedConfig, setEditedConfig] = useState(config);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateConfig = () => {
    const newErrors: Record<string, string> = {};

    if (!editedConfig.path.trim()) {
      newErrors.path = 'API path is required';
    } else if (!editedConfig.path.startsWith('/')) {
      newErrors.path = 'API path must start with /';
    }

    if (!editedConfig.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!editedConfig.querySuggestion.trim()) {
      newErrors.querySuggestion = 'SQL query suggestion is required';
    }

    // Validate parameters
    editedConfig.parameters.forEach((param, index) => {
      if (!param.name.trim()) {
        newErrors[`param_${index}_name`] = 'Parameter name is required';
      }
      if (!param.type.trim()) {
        newErrors[`param_${index}_type`] = 'Parameter type is required';
      }
      if (!param.description.trim()) {
        newErrors[`param_${index}_description`] = 'Parameter description is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateConfig()) {
      onSave(editedConfig);
    }
  };

  const addParameter = () => {
    setEditedConfig({
      ...editedConfig,
      parameters: [
        ...editedConfig.parameters,
        { name: '', type: 'string', description: '' }
      ]
    });
  };

  const removeParameter = (index: number) => {
    setEditedConfig({
      ...editedConfig,
      parameters: editedConfig.parameters.filter((_, i) => i !== index)
    });
  };

  const updateParameter = (index: number, field: string, value: string) => {
    const updatedParameters = editedConfig.parameters.map((param, i) => 
      i === index ? { ...param, [field]: value } : param
    );
    setEditedConfig({
      ...editedConfig,
      parameters: updatedParameters
    });
  };

  return (
    <Card className="animate-slide-up shadow-brand">
      <CardHeader className="bg-linear-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Edit API Configuration</h3>
            <p className="text-sm text-slate-600 mt-1">Customize your API endpoint details</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={onCancel} leftIcon={<XIcon />}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} leftIcon={<CheckIcon />}>
              Save Changes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* HTTP Method and Path */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">HTTP Method</label>
            <select
              value={editedConfig.httpMethod}
              onChange={(e) => setEditedConfig({ ...editedConfig, httpMethod: e.target.value as any })}
              className="input-field"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
              <option value="PATCH">PATCH</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">API Path</label>
            <input
              type="text"
              value={editedConfig.path}
              onChange={(e) => setEditedConfig({ ...editedConfig, path: e.target.value })}
              className={`input-field ${errors.path ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="/v1/users/{userId}"
            />
            {errors.path && <p className="text-red-500 text-sm mt-1">{errors.path}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            value={editedConfig.description}
            onChange={(e) => setEditedConfig({ ...editedConfig, description: e.target.value })}
            className={`input-field resize-none ${errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            rows={3}
            placeholder="Describe what this API endpoint does..."
          />
          {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
        </div>

        {/* Parameters */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-slate-700">Parameters</label>
            <Button variant="secondary" size="sm" onClick={addParameter} leftIcon={<PlusIcon />}>
              Add Parameter
            </Button>
          </div>
          
          {editedConfig.parameters.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
              <p className="text-slate-500 mb-2">No parameters defined</p>
              <Button variant="secondary" size="sm" onClick={addParameter} leftIcon={<PlusIcon />}>
                Add First Parameter
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {editedConfig.parameters.map((param, index) => (
                <div key={index} className="p-4 bg-slate-50 rounded-lg border">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                      <input
                        type="text"
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        className={`input-field text-sm ${errors[`param_${index}_name`] ? 'border-red-300' : ''}`}
                        placeholder="paramName"
                      />
                      {errors[`param_${index}_name`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_name`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter(index, 'type', e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="string">string</option>
                        <option value="integer">integer</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="array">array</option>
                        <option value="object">object</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-slate-600">Description</label>
                        <button
                          onClick={() => removeParameter(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) => updateParameter(index, 'description', e.target.value)}
                        className={`input-field text-sm ${errors[`param_${index}_description`] ? 'border-red-300' : ''}`}
                        placeholder="Parameter description"
                      />
                      {errors[`param_${index}_description`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`param_${index}_description`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SQL Query Suggestion */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">SQL Query Suggestion</label>
          <textarea
            value={editedConfig.querySuggestion}
            onChange={(e) => setEditedConfig({ ...editedConfig, querySuggestion: e.target.value })}
            className={`input-field font-mono text-sm resize-none ${errors.querySuggestion ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
            rows={4}
            placeholder="SELECT * FROM table WHERE column = {parameter};"
          />
          {errors.querySuggestion && <p className="text-red-500 text-sm mt-1">{errors.querySuggestion}</p>}
          <p className="text-xs text-slate-500 mt-1">
            Use {'{parameterName}'} syntax for parameter placeholders
          </p>
        </div>

        {/* Preview */}
        <div className="bg-linear-to-r from-slate-50 to-slate-100 p-4 rounded-lg border">
          <h4 className="font-medium text-slate-700 mb-2">Preview</h4>
          <div className="flex items-center space-x-3 min-w-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              editedConfig.httpMethod === 'GET' ? 'bg-green-100 text-green-800' :
              editedConfig.httpMethod === 'POST' ? 'bg-blue-100 text-blue-800' :
              editedConfig.httpMethod === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {editedConfig.httpMethod}
            </span>
            <code className="text-sm font-mono text-slate-800 bg-white px-3 py-2 rounded border break-all overflow-hidden flex-1 min-w-0">
              {editedConfig.path || '/api/endpoint'}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};