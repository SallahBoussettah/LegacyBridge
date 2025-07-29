
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ApiGenerator } from './components/ApiGenerator';
import { ApiPortal } from './components/ApiPortal';
import { Billing } from './components/Billing';
import { UpgradePlanner } from './components/UpgradePlanner';
import type { View, ApiEndpoint } from './types';
import { initialEndpoints } from './constants';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>(initialEndpoints);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const addApiEndpoint = useCallback((endpoint: ApiEndpoint) => {
    setApiEndpoints(prevEndpoints => [...prevEndpoints, endpoint]);
    setActiveView('portal'); // Navigate to portal after creating an API
  }, []);
  
  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard apiEndpoints={apiEndpoints} />;
      case 'generator':
        return <ApiGenerator onEndpointCreated={addApiEndpoint} />;
      case 'portal':
        return <ApiPortal apiEndpoints={apiEndpoints} />;
      case 'billing':
        return <Billing />;
      case 'planner':
        return <UpgradePlanner />;
      default:
        return <Dashboard apiEndpoints={apiEndpoints} />;
    }
  };

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

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <Sidebar activeView={activeView} setActiveView={setActiveView} isOpen={isSidebarOpen} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        <Header onMenuClick={() => setSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
