'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, className = '' }: StatCardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg shadow-sm p-3 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
          {trend && (
            <div className={`flex items-center gap-1 mt-1 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <svg className={`w-3 h-3 ${!trend.isPositive && 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-md text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
