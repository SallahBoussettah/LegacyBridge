import React, { useState, useEffect } from "react";
import type { ApiEndpoint } from "../types";
import { Button } from "./common/Button";
import { Modal } from "./common/Modal";
import apiService from "../services/apiService";

interface ApiPortalProps {
  refreshTrigger?: number;
}

const HttpMethodBadge: React.FC<{ method: string }> = ({ method }) => {
  const colorClasses = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
    PUT: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
    DEFAULT: "bg-slate-100 text-slate-800",
  };
  const classes =
    colorClasses[method as keyof typeof colorClasses] || colorClasses.DEFAULT;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}
    >
      {method}
    </span>
  );
};

export const ApiPortal: React.FC<ApiPortalProps> = () => {
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch API endpoints on component mount
  useEffect(() => {
    const fetchApiEndpoints = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching API endpoints...');
        const response = await apiService.getApiEndpoints();
        console.log('API endpoints response:', response);
        
        if (response.success && response.data) {
          // Transform backend data to match frontend interface
          const endpoints: ApiEndpoint[] = response.data.endpoints.map((endpoint: any) => ({
            id: endpoint.id.toString(),
            httpMethod: endpoint.httpMethod,
            path: endpoint.path,
            description: endpoint.description,
            parameters: endpoint.parameters || [],
            querySuggestion: endpoint.querySuggestion,
            status: endpoint.status
          }));
          
          console.log('Transformed endpoints:', endpoints);
          setApiEndpoints(endpoints);
        } else {
          console.error('Failed to fetch endpoints:', response);
          setError(response.message || 'Failed to fetch API endpoints');
        }
      } catch (error) {
        console.error('Error fetching API endpoints:', error);
        setError('An unexpected error occurred while fetching endpoints');
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiEndpoints();
  }, []);

  const handleViewDetails = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setIsModalOpen(true);
  };

  const handleDeleteEndpoint = async (endpointId: string) => {
    if (!confirm('Are you sure you want to delete this API endpoint?')) {
      return;
    }

    try {
      const response = await apiService.deleteApiEndpoint(endpointId);
      
      if (response.success) {
        // Remove the endpoint from the local state
        setApiEndpoints(prev => prev.filter(endpoint => endpoint.id !== endpointId));
        setIsModalOpen(false);
        setSelectedEndpoint(null);
      } else {
        alert(response.message || 'Failed to delete endpoint');
      }
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      alert('An unexpected error occurred while deleting the endpoint');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">API Portal</h2>
        <p className="text-lg text-slate-600">
          Explore and manage your generated API endpoints.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading API endpoints...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md">
          <ul className="divide-y divide-slate-200">
            {apiEndpoints.map((endpoint) => (
              <li
                key={endpoint.id}
                className="p-4 hover:bg-slate-50 transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <HttpMethodBadge method={endpoint.httpMethod} />
                    <code className="ml-4 font-mono text-sm text-slate-800 break-all overflow-hidden min-w-0">
                      {endpoint.path}
                    </code>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                    <p className="text-sm text-slate-500 hidden md:block flex-shrink-0 max-w-xs truncate">
                      {endpoint.description}
                    </p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        endpoint.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {endpoint.status}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleViewDetails(endpoint)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {apiEndpoints.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold">No APIs yet!</h3>
              <p className="text-slate-500 mt-2">
                Go to the API Generator to create your first endpoint.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedEndpoint && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="API Endpoint Details"
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-slate-900">Endpoint</h4>
              <div className="mt-2 p-3 bg-slate-100 rounded-md flex items-center min-w-0">
                <HttpMethodBadge method={selectedEndpoint.httpMethod} />
                <code className="ml-3 font-mono text-slate-800 break-all overflow-hidden min-w-0">
                  {selectedEndpoint.path}
                </code>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900">
                Description
              </h4>
              <p className="mt-2 text-slate-600">
                {selectedEndpoint.description}
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900">
                Parameters
              </h4>
              {selectedEndpoint.parameters.length > 0 ? (
                <div className="mt-2 border border-slate-200 rounded-md">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {selectedEndpoint.parameters.map((param, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-slate-900">
                            <code>{param.name}</code>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-slate-500">
                            <code>{param.type}</code>
                          </td>
                          <td className="px-4 py-2 text-sm text-slate-500">
                            {param.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-2 text-slate-500">
                  This endpoint has no parameters.
                </p>
              )}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900">
                Legacy System Query Suggestion
              </h4>
              <div className="mt-2 p-3 bg-slate-900 text-white rounded-md font-mono text-sm overflow-x-auto">
                <pre>
                  <code>{selectedEndpoint.querySuggestion}</code>
                </pre>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t border-slate-200">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDeleteEndpoint(selectedEndpoint.id)}
              >
                Delete Endpoint
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
