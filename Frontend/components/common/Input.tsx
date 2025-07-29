
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600">
        {label}
      </label>
      <div className="mt-1">
        <input
          id={id}
          className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm transition duration-150"
          {...props}
        />
      </div>
    </div>
  );
};
