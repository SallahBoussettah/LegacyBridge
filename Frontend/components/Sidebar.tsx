
import React from 'react';
import type { View, NavigationItem } from '../types';
import { DashboardIcon, GeneratorIcon, PortalIcon, BillingIcon, PlannerIcon } from './icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'generator', label: 'API Generator', icon: <GeneratorIcon /> },
  { id: 'portal', label: 'API Portal', icon: <PortalIcon /> },
  { id: 'billing', label: 'Billing', icon: <BillingIcon /> },
  { id: 'planner', label: 'Upgrade Planner', icon: <PlannerIcon /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen }) => {
  return (
    <aside className={`fixed top-0 left-0 z-40 w-64 h-screen bg-slate-950 text-white flex flex-col transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-center h-20 border-b border-slate-800">
        <h1 className="text-2xl font-bold">LegacyBridge</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <a
            key={item.id}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActiveView(item.id);
            }}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${
              activeView === item.id
                ? 'bg-brand-primary text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="ml-4">{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-800">
        <p className="text-xs text-slate-500">&copy; 2024 LegacyBridge Inc.</p>
      </div>
    </aside>
  );
};
