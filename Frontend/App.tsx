
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ApiGenerator } from './components/ApiGenerator';
import { ApiPortal } from './components/ApiPortal';
import { DatabaseManager } from './components/DatabaseManager';
import { Billing } from './components/Billing';
import { UpgradePlanner } from './components/UpgradePlanner';
import { AuthPage } from './components/auth/AuthPage';
import type { View, ApiEndpoint } from './types';
import authService from './services/authService';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const addApiEndpoint = useCallback((endpoint: ApiEndpoint) => {
    // Navigate to portal after creating an API
    setActiveView('portal');
  }, []);
  
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'generator':
        return <ApiGenerator onEndpointCreated={addApiEndpoint} />;
      case 'portal':
        return <ApiPortal />;
      case 'databases':
        return <DatabaseManager />;
      case 'billing':
        return <Billing />;
      case 'planner':
        return <UpgradePlanner />;
      default:
        return <Dashboard />;
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = authService.isAuthenticated();
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setActiveView('dashboard');
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-slate-600">Loading LegacyBridge...</p>
        </div>
      </div>
    );
  }

  // Show authentication page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  // Show main application if authenticated
  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} onLogout={handleLogout} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
