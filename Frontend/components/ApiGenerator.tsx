import React, { useState, useCallback, useRef, useEffect } from "react";
import { generateApiConfig, testApiEndpoint } from "../services/geminiService";
import apiService from "../services/apiService";
import type { ApiEndpoint } from "../types";
import { Button } from "./common/Button";
import { Card, CardContent, CardHeader } from "./common/Card";
import {
  SparklesIcon,
  InfoIcon,
  PlayIcon,
  EditIcon,
  CopyIcon,
  CheckIcon,
} from "./icons";
import { ApiTester } from "./ApiTester";
import { ApiEditor } from "./ApiEditor";
import { DatabaseSelectionModal } from "./DatabaseSelectionModal";

interface ApiGeneratorProps {
  onEndpointCreated: (endpoint: ApiEndpoint) => void;
}

export const ApiGenerator: React.FC<ApiGeneratorProps> = ({
  onEndpointCreated,
}) => {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedConfig, setGeneratedConfig] = useState<Omit<
    ApiEndpoint,
    "id" | "status"
  > | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<
    Array<{
      prompt: string;
      config: Omit<ApiEndpoint, "id" | "status">;
      timestamp: Date;
    }>
  >([]);
  const [copied, setCopied] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const [executionMode, setExecutionMode] = useState<"mock" | "database">(
    "mock"
  );
  const [databaseSchema, setDatabaseSchema] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle database selection from modal
  const handleDatabaseSelection = (
    mode: "mock" | "database",
    databaseId?: string,
    schema?: any
  ) => {
    setExecutionMode(mode);
    setSelectedDatabaseId(databaseId || "");
    setDatabaseSchema(schema || null);

    // Now proceed with AI generation
    proceedWithGeneration();
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description for the API you want to create.");
      return;
    }

    // Show database selection modal first
    setShowDatabaseModal(true);
  };

  const proceedWithGeneration = async () => {
    setIsLoading(true);
    setError(null);
    setGeneratedConfig(null);
    setIsEditing(false);
    setShowTester(false);

    try {
      console.log("Generating API with database schema:", !!databaseSchema);
      const config = await generateApiConfig(prompt, databaseSchema);
      setGeneratedConfig({
        ...config,
        executionMode,
        databaseConnectionId: selectedDatabaseId,
      });

      // Add to history
      setGenerationHistory((prev) => [
        {
          prompt,
          config: {
            ...config,
            executionMode,
            databaseConnectionId: selectedDatabaseId,
          },
          timestamp: new Date(),
        },
        ...prev.slice(0, 4),
      ]); // Keep last 5 generations

      // Generate suggestions for improvement
      generateSuggestions(config);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = useCallback(
    (config: Omit<ApiEndpoint, "id" | "status">) => {
      const suggestions = [];

      if (config.parameters.length === 0) {
        suggestions.push(
          "Consider adding query parameters for filtering or pagination"
        );
      }

      if (config.httpMethod === "GET" && !config.path.includes("{")) {
        suggestions.push(
          "Consider adding path parameters for specific resource access"
        );
      }

      if (config.httpMethod === "POST" && config.parameters.length < 2) {
        suggestions.push(
          "POST endpoints typically require multiple parameters for data creation"
        );
      }

      setSuggestions(suggestions);
    },
    []
  );

  const handleCopyConfig = async () => {
    if (!generatedConfig) return;

    const configText = JSON.stringify(generatedConfig, null, 2);
    await navigator.clipboard.writeText(configText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditConfig = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = (
    updatedConfig: Omit<ApiEndpoint, "id" | "status">
  ) => {
    setGeneratedConfig(updatedConfig);
    setIsEditing(false);
    generateSuggestions(updatedConfig);
  };

  const handleTestApi = () => {
    setShowTester(true);
  };

  const handleCreateEndpoint = async () => {
    if (generatedConfig) {
      setIsLoading(true);
      setError(null);

      try {
        // Create endpoint data for the API
        const endpointData = {
          name: `${generatedConfig.httpMethod} ${generatedConfig.path}`,
          httpMethod: generatedConfig.httpMethod,
          path: generatedConfig.path,
          description: generatedConfig.description,
          parameters: generatedConfig.parameters,
          querySuggestion: generatedConfig.querySuggestion,
          databaseConnectionId: selectedDatabaseId || null,
          executionMode: executionMode,
        };

        // Save to backend
        const response = await apiService.createApiEndpoint(endpointData);

        if (response.success && response.data) {
          // Create the endpoint object for the parent component
          const newEndpoint: ApiEndpoint = {
            id: response.data.endpoint.id.toString(),
            httpMethod: response.data.endpoint.httpMethod,
            path: response.data.endpoint.path,
            description: response.data.endpoint.description,
            parameters: response.data.endpoint.parameters,
            querySuggestion: response.data.endpoint.querySuggestion,
            status: response.data.endpoint.status,
            executionMode: response.data.endpoint.executionMode,
            databaseConnectionId: response.data.endpoint.databaseConnectionId,
          };

          onEndpointCreated(newEndpoint);

          // Show success message
          alert(
            "API endpoint created successfully! You can view it in the API Portal."
          );

          // Reset form
          setPrompt("");
          setGeneratedConfig(null);
          setIsEditing(false);
          setShowTester(false);
          setSuggestions([]);
        } else {
          setError(response.message || "Failed to create API endpoint");
        }
      } catch (error) {
        console.error("Error creating endpoint:", error);
        setError("An unexpected error occurred while creating the endpoint");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUseHistoryItem = (historyItem: {
    prompt: string;
    config: Omit<ApiEndpoint, "id" | "status">;
    timestamp: Date;
  }) => {
    setPrompt(historyItem.prompt);
    setGeneratedConfig(historyItem.config);
    setError(null);
    generateSuggestions(historyItem.config);
  };

  // Fetch database connections on component mount
  useEffect(() => {
    const fetchDatabaseConnections = async () => {
      try {
        const response = await apiService.getDatabaseConnections(true); // Only active connections
        if (response.success && response.data) {
          // This was the issue - we don't need to do anything with the connections here
          // since we're using the DatabaseSelectionModal to handle database selection
          console.log('Database connections loaded:', response.data.connections.length);
        }
      } catch (error) {
        console.error("Error fetching database connections:", error);
      }
    };

    fetchDatabaseConnections();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [prompt]);

  const examplePrompts = [
    "Create a GET endpoint to fetch a customer's order history by their customer ID with pagination support.",
    "I need a POST endpoint to add a new product to our inventory system. It should take a product name, SKU, price, and category.",
    "Generate a DELETE endpoint for removing a user account using their email address with confirmation.",
    "Build a PUT endpoint to update customer information including name, email, and address validation.",
    "Create a GET endpoint to search products by name, category, and price range with sorting options.",
    "I want a POST endpoint for user authentication that takes email and password and returns a JWT token.",
    "Generate a GET endpoint to retrieve sales analytics data with date range filtering and grouping options.",
    "Create a PATCH endpoint to update order status with tracking information and notification triggers.",
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 bg-linear-to-r from-brand-primary to-brand-secondary p-1 rounded-full">
          <div className="bg-white rounded-full p-2">
            <SparklesIcon className="h-6 w-6 text-brand-primary" />
          </div>
          <span className="text-white font-medium px-4 py-1">
            AI-Powered API Generator
          </span>
        </div>
        <h2 className="text-4xl font-bold text-gradient">
          Transform Ideas into APIs
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Describe your API needs in plain English. Our advanced AI will
          generate production-ready REST endpoints with documentation,
          validation, and legacy system integration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-brand">
            <CardContent className="space-y-6">
              <div>
                <label
                  htmlFor="api-prompt"
                  className="block text-sm font-semibold text-slate-700 mb-3"
                >
                  Describe Your API Requirements
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    id="api-prompt"
                    rows={4}
                    className="input-field resize-none min-h-[120px] pr-12"
                    placeholder="e.g., I need an endpoint to retrieve customer order history with pagination, filtering by date range, and sorting options..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                  />
                  {prompt && (
                    <button
                      onClick={() => setPrompt("")}
                      className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Example Prompts */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Quick Examples:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {examplePrompts.slice(0, 4).map((example, i) => (
                      <button
                        key={i}
                        onClick={() => setPrompt(example)}
                        className="text-xs bg-slate-100 hover:bg-brand-light text-slate-700 hover:text-brand-primary px-3 py-1 rounded-full transition-colors duration-200"
                        disabled={isLoading}
                      >
                        {example.slice(0, 50)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <InfoIcon className="h-4 w-4" />
                  <span>
                    Be specific about parameters, validation, and business logic
                  </span>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim()}
                  leftIcon={
                    isLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      <SparklesIcon />
                    )
                  }
                  className="shadow-brand"
                >
                  {isLoading ? "Generating..." : "Generate API"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="animate-slide-up bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Generation Error
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated Configuration */}
          {generatedConfig && !isEditing && (
            <Card className="animate-slide-up shadow-brand">
              <CardHeader className="bg-linear-to-r from-green-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Generated API Configuration
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      AI-generated REST endpoint ready for deployment
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCopyConfig}
                      leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleEditConfig}
                      leftIcon={<EditIcon />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleTestApi}
                      leftIcon={<PlayIcon />}
                    >
                      Test
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Endpoint Display */}
                <div className="p-4 bg-linear-to-r from-slate-50 to-slate-100 rounded-lg border">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                        generatedConfig.httpMethod === "GET"
                          ? "bg-green-100 text-green-800"
                          : generatedConfig.httpMethod === "POST"
                          ? "bg-blue-100 text-blue-800"
                          : generatedConfig.httpMethod === "PUT"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {generatedConfig.httpMethod}
                    </span>
                    <code className="text-sm font-mono text-slate-800 bg-white px-3 py-2 rounded border break-all overflow-hidden flex-1 min-w-0">
                      {generatedConfig.path}
                    </code>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">
                    Description
                  </h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">
                    {generatedConfig.description}
                  </p>
                </div>

                {/* Parameters */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">
                    Parameters
                  </h4>
                  {generatedConfig.parameters.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {generatedConfig.parameters.map((param, index) => (
                            <tr key={index} className="hover:bg-slate-50">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <code className="text-sm font-medium text-brand-primary bg-brand-light px-2 py-1 rounded">
                                  {param.name}
                                </code>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                  {param.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {param.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                      <p className="text-slate-500">
                        No parameters defined for this endpoint
                      </p>
                    </div>
                  )}
                </div>

                {/* SQL Query Suggestion */}
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">
                    Legacy System Integration
                  </h4>
                  <div className="code-block">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400 uppercase tracking-wide">
                        SQL Query Suggestion
                      </span>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            generatedConfig.querySuggestion
                          )
                        }
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Copy Query
                      </button>
                    </div>
                    <pre className="text-sm">
                      <code>{generatedConfig.querySuggestion}</code>
                    </pre>
                  </div>
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      💡 AI Suggestions
                    </h4>
                    <ul className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-amber-700">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Database Context Display */}
                {executionMode === "database" && databaseSchema && (
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      🗄️ Database-Aware Generation
                    </h4>
                    <div className="text-sm text-green-700">
                      <p className="mb-2">
                        <strong>Connected to:</strong> {databaseSchema.database}{" "}
                        ({databaseSchema.type})
                      </p>
                      <p className="mb-2">
                        <strong>Tables analyzed:</strong>{" "}
                        {databaseSchema.tables.length}
                      </p>
                      <p className="text-xs text-green-600">
                        ✨ AI generated this API using your actual database
                        schema for maximum accuracy
                      </p>
                    </div>
                  </div>
                )}

                {executionMode === "mock" && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      🎭 Mock Data Generation
                    </h4>
                    <p className="text-sm text-blue-700">
                      This API was generated for testing with sample data. For
                      production use, regenerate with a real database
                      connection.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div className="text-sm text-slate-500">
                    Ready to deploy this endpoint?
                  </div>
                  <Button
                    onClick={handleCreateEndpoint}
                    className="shadow-brand"
                  >
                    Create Endpoint
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API Editor */}
          {isEditing && generatedConfig && (
            <ApiEditor
              config={generatedConfig}
              onSave={handleSaveEdit}
              onCancel={() => setIsEditing(false)}
            />
          )}

          {/* API Tester */}
          {showTester && generatedConfig && (
            <ApiTester
              config={generatedConfig}
              onClose={() => setShowTester(false)}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Generation History */}
          {generationHistory.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-800">
                  Recent Generations
                </h3>
                <p className="text-sm text-slate-500">
                  Your last few API generations
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {generationHistory.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleUseHistoryItem(item)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.config.httpMethod === "GET"
                            ? "bg-green-100 text-green-700"
                            : item.config.httpMethod === "POST"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.config.httpMethod}
                      </span>
                      <code className="text-xs text-slate-600">
                        {item.config.path}
                      </code>
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {item.prompt}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Help & Tips */}
          {!isLoading && !generatedConfig && (
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-slate-800">💡 Pro Tips</h3>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">Be Specific</h4>
                  <p className="text-slate-600">
                    Include details about parameters, validation rules, and
                    expected responses.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">
                    Mention Legacy Systems
                  </h4>
                  <p className="text-slate-600">
                    Reference your existing database or system for better SQL
                    suggestions.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-700">Think RESTful</h4>
                  <p className="text-slate-600">
                    Use standard HTTP methods and resource-based URLs for best
                    results.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Status */}
          <Card>
            <CardContent className="text-center space-y-3">
              <div className="inline-flex items-center space-x-2 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">AI Model Online</span>
              </div>
              <p className="text-xs text-slate-500">
                Powered by Google Gemini 2.5 Flash
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Database Selection Modal */}
      <DatabaseSelectionModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
        onConfirm={handleDatabaseSelection}
      />
    </div>
  );
};
