
import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader } from './common/Card';
import type { ApiEndpoint } from '../types';
import apiService from '../services/apiService';

interface DashboardProps {}

const apiCallData = [
  { name: 'Mon', calls: 4000 },
  { name: 'Tue', calls: 3000 },
  { name: 'Wed', calls: 2000 },
  { name: 'Thu', calls: 2780 },
  { name: 'Fri', calls: 1890 },
  { name: 'Sat', calls: 2390 },
  { name: 'Sun', calls: 3490 },
];

const errorRateData = [
  { name: 'Success', value: 95, color: '#4CAF50' },
  { name: 'Errors', value: 5, color: '#F44336' },
];

const latencyData = [
  { endpoint: '/users', latency: 120 },
  { endpoint: '/products', latency: 85 },
  { endpoint: '/orders', latency: 250 },
  { endpoint: '/inventory', latency: 150 },
  { endpoint: '/customers', latency: 95 },
];


export const Dashboard: React.FC<DashboardProps> = () => {
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch API endpoints
        const endpointsResponse = await apiService.getApiEndpoints();
        if (endpointsResponse.success && endpointsResponse.data) {
          const endpoints: ApiEndpoint[] = endpointsResponse.data.endpoints.map((endpoint: any) => ({
            id: endpoint.id.toString(),
            httpMethod: endpoint.httpMethod,
            path: endpoint.path,
            description: endpoint.description,
            parameters: endpoint.parameters || [],
            querySuggestion: endpoint.querySuggestion,
            status: endpoint.status
          }));
          setApiEndpoints(endpoints);
        }

        // Fetch stats
        const statsResponse = await apiService.getEndpointStats();
        if (statsResponse.success && statsResponse.data) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeEndpoints = apiEndpoints.filter(ep => ep.status === 'active').length;
  const totalCalls = apiCallData.reduce((acc, cur) => acc + cur.calls, 0);
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
        <div className="text-center py-12">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-slate-500">Total API Calls</p>
            <p className="text-3xl font-bold text-slate-900">{totalCalls.toLocaleString()}</p>
            <p className="text-sm text-green-500">+5.4% this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-slate-500">Active Endpoints</p>
            <p className="text-3xl font-bold text-slate-900">{activeEndpoints}</p>
            <p className="text-sm text-slate-500">{apiEndpoints.length} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm font-medium text-slate-500">Average Latency</p>
            <p className="text-3xl font-bold text-slate-900">140ms</p>
            <p className="text-sm text-red-500">+12ms from last week</p>
          </CardContent>
        </Card>
         <Card>
          <CardContent>
            <p className="text-sm font-medium text-slate-500">Est. Monthly Cost</p>
            <p className="text-3xl font-bold text-slate-900">$4,250</p>
            <p className="text-sm text-slate-500">Based on usage</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold">API Calls This Week</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={apiCallData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calls" stroke="#1976D2" strokeWidth={2} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Success vs. Error Rate</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={errorRateData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {errorRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Endpoint Latency (ms)</h3>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
               <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="endpoint" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="latency" fill="#42A5F5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
    </div>
  );
};
