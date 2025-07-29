
import React, { useState } from 'react';
import { MenuIcon, UserIcon } from './icons';
import authService from '../services/authService';

interface HeaderProps {
    onMenuClick: () => void;
    onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    setShowUserMenu(false);
    onLogout?.();
  };

  return (
    <header className="flex-shrink-0 bg-white shadow-sm z-30">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <button onClick={onMenuClick} className="text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary md:hidden">
          <span className="sr-only">Open sidebar</span>
          <MenuIcon />
        </button>
        <div className="flex-1 flex justify-end items-center">
          <div className="relative">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-600 hidden sm:block">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </span>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="h-9 w-9 rounded-full bg-brand-light flex items-center justify-center text-brand-primary hover:bg-brand-secondary hover:text-white transition-colors"
              >
                <UserIcon/>
              </button>
            </div>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-slate-200">
                <div className="px-4 py-2 border-b border-slate-200">
                  <p className="text-sm font-medium text-slate-900">
                    {user ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close menu when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
};
