'use client';

import React, { useState } from 'react';
import ChallengeList from '../../components/challenges/ChallengeList';
import ChallengeComposer from '../../components/challenges/ChallengeComposer';

export default function ChallengesPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleChallengeCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Challenges</h1>
        <p className="text-gray-600">
          Join challenges to grow across your 7 layers and earn points for completing them.
        </p>
      </div>

      <div className="space-y-6">
        <ChallengeComposer onChallengeCreated={handleChallengeCreated} />
        <ChallengeList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
