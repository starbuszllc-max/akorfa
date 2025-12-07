import React from 'react';

export default function Button({children, className = '', ...props}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
