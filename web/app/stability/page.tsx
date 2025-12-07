import React from 'react';
import dynamic from 'next/dynamic';

const StabilityCalculator = dynamic(() => import('../../components/StabilityCalculator'), {ssr: false});

export default function StabilityPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">Stability Calculator</h1>
      <p className="text-gray-600 mb-4">Adjust variables to see how system stability changes.</p>
      <div className="max-w-3xl">
        <StabilityCalculator />
      </div>
    </main>
  );
}
