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
    <div className="max-w-4xl mx-auto px-3">
      <div className="mb-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">Challenges</h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Grow across your 7 layers and earn points.
        </p>
      </div>

      <div className="space-y-3">
        <ChallengeComposer onChallengeCreated={handleChallengeCreated} />
        <ChallengeList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
