import React, { useState } from 'react';
import type { ApiEndpoint } from '../types';
import { Button } from './common/Button';
import { Card, CardContent, CardHeader } from './common/Card';
import { PlayIcon, XIcon, CopyIcon, CheckIcon } from './icons';
import apiService from '../services/apiService';

interface ApiTesterProps {
  config: Omit<ApiEndpoint, 'id' | 'status'>;
  onClose: () => void;
}

interface TestResult {
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  duration: number;
}

export const ApiTester: React.FC<ApiTesterProps> = ({ config, onClose }) => {
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleParameterChange = (paramName: string, value: string) => {
    setParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const generateTestUrl = () => {
    let url = config.path;
    const queryParams: string[] = [];

    // Replace path parameters
    config.parameters.forEach(param => {
      const value = parameters[param.name] || `{${param.name}}`;
      if (url.includes(`{${param.name}}`)) {
        url = url.replace(`{${param.name}}`, encodeURIComponent(value));
      } else {
        // Assume it's a query parameter
        if (parameters[param.name]) {
          queryParams.push(`${param.name}=${encodeURIComponent(parameters[param.name])}`);
        }
      }
    });

    if (queryParams.length > 0) {
      url += '?' + queryParams.join('&');
    }

    return `https://api.example.com${url}`;
  };

  const generateCurlCommand = () => {
    const url = generateTestUrl();
    let curl = `curl -X ${config.httpMethod} "${url}"`;
    
    if (config.httpMethod === 'POST' || config.httpMethod === 'PUT' || config.httpMethod === 'PATCH') {
      curl += ' \\\n  -H "Content-Type: application/json"';
      
      const bodyParams = config.parameters.filter(param => 
        !config.path.includes(`{${param.name}}`)
      );
      
      if (bodyParams.length > 0) {
        const body = bodyParams.reduce((acc, param) => {
          acc[param.name] = parameters[param.name] || `example_${param.name}`;
          return acc;
        }, {} as Record<string, string>);
        
        curl += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
      }
    }
    
    return curl;
  };

  const simulateApiTest = async () => {
    setIsLoading(true);
    setError(null);
    setTestResult(null);

    try {
      // If we have an endpoint ID, use the real backend test
      if (config.id) {
        const response = await apiService.testApiEndpoint(config.id, parameters);
        
        if (response.success && response.data) {
          setTestResult({
            status: response.data.statusCode,
            statusText: response.data.statusCode === 200 ? 'OK' : 
                       response.data.statusCode === 201 ? 'Created' :
                       response.data.statusCode === 204 ? 'No Content' : 'Error',
            duration: response.data.responseTime,
            headers: response.data.headers || {},
            data: response.data.data
          });
        } else {
          setError(response.message || 'Failed to test API endpoint');
        }
      } else {
        // Fallback to mock response for generated configs that aren't saved yet
        const mockResponse = generateMockResponse();
        setTestResult(mockResponse);
      }
    } catch (err) {
      console.error('API test error:', err);
      setError('Failed to test API endpoint');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (): TestResult => {
    const duration = Math.floor(100 + Math.random() * 500);
    
    switch (config.httpMethod) {
      case 'GET':
        return {
          status: 200,
          statusText: 'OK',
          duration,
          headers: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${duration}ms`
          },
          data: generateMockData()
        };
      
      case 'POST':
        return {
          status: 201,
          statusText: 'Created',
          duration,
          headers: {
            'Content-Type': 'application/json',
            'Location': generateTestUrl() + '/123'
          },
          data: {
            id: 123,
            message: 'Resource created successfully',
            ...generateMockData()
          }
        };
      
      case 'PUT':
      case 'PATCH':
        return {
          status: 200,
          statusText: 'OK',
          duration,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            message: 'Resource updated successfully',
            ...generateMockData()
          }
        };
      
      case 'DELETE':
        return {
          status: 204,
          statusText: 'No Content',
          duration,
          headers: {},
          data: null
        };
      
      default:
        return {
          status: 200,
          statusText: 'OK',
          duration,
          headers: {
            'Content-Type': 'application/json'
          },
          data: generateMockData()
        };
    }
  };

  const generateMockData = () => {
    // Generate mock data based on the API description and parameters
    const mockData: any = {};
    
    config.parameters.forEach(param => {
      const value = parameters[param.name];
      if (value) {
        switch (param.type) {
          case 'integer':
            mockData[param.name] = parseInt(value) || 123;
            break;
          case 'number':
            mockData[param.name] = parseFloat(value) || 123.45;
            break;
          case 'boolean':
            mockData[param.name] = value.toLowerCase() === 'true';
            break;
          default:
            mockData[param.name] = value;
        }
      }
    });

    // Add some common mock fields
    if (config.path.includes('user')) {
      return {
        ...mockData,
        id: 123,
        name: 'John Doe',
        email: 'john.doe@example.com',
        created_at: new Date().toISOString()
      };
    }

    if (config.path.includes('product')) {
      return {
        ...mockData,
        id: 456,
        name: 'Sample Product',
        price: 29.99,
        category: 'Electronics',
        in_stock: true
      };
    }

    return {
      ...mockData,
      id: Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      status: 'success'
    };
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="animate-slide-up shadow-brand">
      <CardHeader className="bg-linear-to-r from-purple-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">API Tester</h3>
            <p className="text-sm text-slate-600 mt-1">Test your API endpoint with sample data</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onClose} leftIcon={<XIcon />}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Endpoint Display */}
        <div className="p-4 bg-linear-to-r from-slate-50 to-slate-100 rounded-lg border">
          <div className="flex items-center space-x-3 mb-2 min-w-0">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
              config.httpMethod === 'GET' ? 'bg-green-100 text-green-800' :
              config.httpMethod === 'POST' ? 'bg-blue-100 text-blue-800' :
              config.httpMethod === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {config.httpMethod}
            </span>
            <code className="text-sm font-mono text-slate-800 bg-white px-3 py-2 rounded border break-all overflow-hidden flex-1 min-w-0">
              {generateTestUrl()}
            </code>
          </div>
          <p className="text-sm text-slate-600">{config.description}</p>
        </div>

        {/* Parameters Input */}
        {config.parameters.length > 0 && (
          <div>
            <h4 className="font-semibold text-slate-800 mb-3">Test Parameters</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.parameters.map((param, index) => (
                <div key={index} className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    {param.name}
                    <span className="text-slate-500 ml-1">({param.type})</span>
                  </label>
                  <input
                    type={param.type === 'integer' || param.type === 'number' ? 'number' : 'text'}
                    value={parameters[param.name] || ''}
                    onChange={(e) => handleParameterChange(param.name, e.target.value)}
                    className="input-field"
                    placeholder={`Enter ${param.name}...`}
                  />
                  <p className="text-xs text-slate-500">{param.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* cURL Command */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-800">cURL Command</h4>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => copyToClipboard(generateCurlCommand())}
              leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="code-block">
            <pre className="text-sm whitespace-pre-wrap">{generateCurlCommand()}</pre>
          </div>
        </div>

        {/* Test Button */}
        <div className="flex items-center justify-center">
          <Button
            onClick={simulateApiTest}
            disabled={isLoading}
            leftIcon={isLoading ? <div className="loading-spinner" /> : <PlayIcon />}
            className="shadow-brand"
          >
            {isLoading ? 'Testing...' : 'Test API Endpoint'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Test Failed</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResult && (
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-800">Test Results</h4>
            
            {/* Status */}
            <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">Status:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                  testResult.status >= 200 && testResult.status < 300 
                    ? 'bg-green-100 text-green-800'
                    : testResult.status >= 400
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {testResult.status} {testResult.statusText}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-600">Duration:</span>
                <span className="text-sm text-slate-800">{testResult.duration}ms</span>
              </div>
            </div>

            {/* Headers */}
            {Object.keys(testResult.headers).length > 0 && (
              <div>
                <h5 className="font-medium text-slate-700 mb-2">Response Headers</h5>
                <div className="code-block">
                  <pre className="text-sm">
                    {Object.entries(testResult.headers)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join('\n')}
                  </pre>
                </div>
              </div>
            )}

            {/* Response Body */}
            {testResult.data && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-slate-700">Response Body</h5>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(testResult.data, null, 2))}
                    leftIcon={<CopyIcon />}
                  >
                    Copy JSON
                  </Button>
                </div>
                <div className="code-block">
                  <pre className="text-sm">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Mock Testing</h3>
              <p className="text-sm text-blue-700 mt-1">
                This is a simulated test with mock data. Real API testing will be available once the endpoint is deployed.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};