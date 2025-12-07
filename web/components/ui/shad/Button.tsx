import React from 'react';

export default function ShadButton({children, className = '', ...props}: React.ButtonHTMLAttributes<HTMLButtonElement>){
  return (
    <button {...props} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary-600 text-white ${className}`}>{children}</button>
  );
}
