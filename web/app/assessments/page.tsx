import React from 'react';
import dynamic from 'next/dynamic';

const AssessmentForm = dynamic(() => import('../../components/AssessmentForm'), {ssr: false});

export default function AssessmentsPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">7-Layer Assessment</h1>
      <p className="text-gray-600 mb-4">Rate each layer from 0 (low) to 10 (high).</p>
      <div className="bg-white p-4 rounded-md shadow-sm">
        <AssessmentForm />
      </div>
    </main>
  );
}
