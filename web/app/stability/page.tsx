'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const StabilityCalculator = dynamic(() => import('../../components/StabilityCalculator'), {ssr: false});

export default function StabilityPage() {
  return (
    <main className="py-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Stability Calculator</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Model your personal or organizational stability using our proprietary formula. 
            Adjust the parameters to understand how different factors affect overall system stability.
          </p>
        </div>
        <StabilityCalculator />
      </div>
    </main>
  );
}
