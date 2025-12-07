'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const AssessmentForm = dynamic(() => import('../../components/AssessmentForm'), {ssr: false});

export default function AssessmentsPage() {
  return (
    <div className="py-4">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            7-Layer Self Assessment
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto mb-4">
          Explore the seven dimensions of human development. Rate each layer honestly 
          to discover insights about your current state and identify areas for growth.
        </p>
        <Link 
          href="/assessments/history"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          View Assessment History
        </Link>
      </div>
      
      <AssessmentForm />
    </div>
  );
}
