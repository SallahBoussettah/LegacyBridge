
import React, { useState } from 'react';
import { generateApiConfig } from '../services/geminiService';
import type { ApiEndpoint } from '../types';
import { Button } from './common/Button';
import { Card, CardContent, CardHeader } from './common/Card';
import { SparklesIcon, InfoIcon } from './icons';

interface ApiGeneratorProps {
  onEndpointCreated: (endpoint: ApiEndpoint) => void;
}

export const ApiGenerator: React.FC<ApiGeneratorProps> = ({ onEndpointCreated }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<Omit<ApiEndpoint, 'id' | 'status'> | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the API you want to create.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedConfig(null);

    try {
      const config = await generateApiConfig(prompt);
      setGeneratedConfig(config);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEndpoint = () => {
    if (generatedConfig) {
      const newEndpoint: ApiEndpoint = {
        ...generatedConfig,
        id: new Date().toISOString(),
        status: 'active',
      };
      onEndpointCreated(newEndpoint);
      // Reset form
      setPrompt('');
      setGeneratedConfig(null);
    }
  };
  
  const examplePrompts = [
    "Create a GET endpoint to fetch a customer's order history by their customer ID.",
    "I need a POST endpoint to add a new product to our inventory system. It should take a product name, SKU, and price.",
    "Generate a DELETE endpoint for removing a user account using their email address."
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800">API Generator</h2>
        <p className="mt-2 text-lg text-slate-600">
          Describe the functionality you want to expose. Our AI will generate a modern REST API endpoint for you.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="api-prompt" className="block text-sm font-medium text-slate-700 mb-1">
              API Description
            </label>
            <textarea
              id="api-prompt"
              rows={4}
              className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary"
              placeholder="e.g., An endpoint to get user details by their ID from our old customer database."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
            />
             <div className="mt-2 text-xs text-slate-500">
                <p>Try one of these examples:</p>
                <ul className="list-disc list-inside">
                    {examplePrompts.map((p, i) => (
                        <li key={i}><button onClick={() => setPrompt(p)} className="text-brand-secondary hover:underline">{p}</button></li>
                    ))}
                </ul>
             </div>
          </div>
          <div className="text-right">
            <Button onClick={handleGenerate} disabled={isLoading} leftIcon={<SparklesIcon />}>
              {isLoading ? 'Generating...' : 'Generate with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {generatedConfig && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-slate-800">Generated API Configuration</h3>
            <p className="text-sm text-slate-500">Review the generated configuration below before creating the endpoint.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-md">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${generatedConfig.httpMethod === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{generatedConfig.httpMethod}</span>
              <code className="ml-3 text-lg font-mono text-slate-800">{generatedConfig.path}</code>
            </div>
            <div>
              <h4 className="font-semibold">Description:</h4>
              <p className="text-slate-600">{generatedConfig.description}</p>
            </div>
            
            <div>
                <h4 className="font-semibold">Parameters:</h4>
                {generatedConfig.parameters.length > 0 ? (
                    <ul className="list-disc list-inside mt-1 space-y-1 text-slate-600">
                        {generatedConfig.parameters.map((p, i) => <li key={i}><code>{p.name}</code> ({p.type}): {p.description}</li>)}
                    </ul>
                ) : <p className="text-slate-500">No parameters defined.</p>}
            </div>

            <div>
              <h4 className="font-semibold">Legacy System Query Suggestion:</h4>
              <div className="mt-1 p-3 bg-slate-900 text-white rounded-md font-mono text-sm overflow-x-auto">
                <pre><code>{generatedConfig.querySuggestion}</code></pre>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <Button onClick={handleCreateEndpoint}>
                Create Endpoint
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

       {!isLoading && !generatedConfig && (
        <div className="bg-blue-50 border-l-4 border-brand-accent text-brand-primary p-4" role="alert">
          <div className="flex">
            <div className="py-1"><InfoIcon className="h-5 w-5 text-brand-primary mr-3"/></div>
            <div>
              <p className="font-bold">How it works</p>
              <p className="text-sm text-slate-700">LegacyBridge uses a powerful AI model to interpret your needs and suggest a well-structured API. It helps standardize your legacy data access, provides clear documentation, and even suggests how to query your old systems.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
