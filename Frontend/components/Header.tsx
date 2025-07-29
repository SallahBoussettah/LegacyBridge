
import React from 'react';
import { MenuIcon, UserIcon } from './icons';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="flex-shrink-0 bg-white shadow-sm z-30">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <button onClick={onMenuClick} className="text-slate-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-primary md:hidden">
          <span className="sr-only">Open sidebar</span>
          <MenuIcon />
        </button>
        <div className="flex-1 flex justify-end items-center">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 hidden sm:block">Jane Doe</span>
            <div className="h-9 w-9 rounded-full bg-brand-light flex items-center justify-center text-brand-primary">
                <UserIcon/>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
