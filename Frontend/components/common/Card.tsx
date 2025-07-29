
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => {
    return <div className={`p-6 ${className}`}>{children}</div>;
}

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => {
    return <div className={`p-6 border-b border-slate-200 ${className}`}>{children}</div>
}
