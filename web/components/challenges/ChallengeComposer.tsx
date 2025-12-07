'use client';
import React, { useState, useEffect } from 'react';

interface ChallengeComposerProps {
  onChallengeCreated?: () => void;
}

const layers = [
  { value: 'environment', label: 'Environment', icon: '🌍' },
  { value: 'biological', label: 'Biological', icon: '🧬' },
  { value: 'internal', label: 'Internal', icon: '🧠' },
  { value: 'cultural', label: 'Cultural', icon: '🎭' },
  { value: 'social', label: 'Social', icon: '👥' },
  { value: 'conscious', label: 'Conscious', icon: '💡' },
  { value: 'existential', label: 'Existential', icon: '✨' }
];

export default function ChallengeComposer({ onChallengeCreated }: ChallengeComposerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [layer, setLayer] = useState('social');
  const [durationDays, setDurationDays] = useState(7);
  const [pointsReward, setPointsReward] = useState(50);
  const [loading, setLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('demo_user_id');
    if (storedUserId) {
      setDemoMode(true);
      setUserId(storedUserId);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !userId) return;

    setLoading(true);
    try {
      const resp = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          layer,
          duration_days: durationDays,
          points_reward: pointsReward,
          user_id: userId
        })
      });

      if (resp.ok) {
        setTitle('');
        setDescription('');
        setLayer('social');
        setDurationDays(7);
        setPointsReward(50);
        setIsExpanded(false);
        onChallengeCreated?.();
      } else {
        const data = await resp.json();
        console.error('Error creating challenge:', data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!demoMode) {
    return (
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 text-center border border-indigo-100">
        <div className="text-3xl mb-2">🎯</div>
        <p className="text-gray-600">Enable demo mode from the feed to create challenges</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full p-4 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-xl">
            🎯
          </div>
          <span className="text-gray-500">Create a new challenge...</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Create Challenge</h3>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Challenge title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                maxLength={100}
              />
            </div>

            <div>
              <textarea
                placeholder="Describe the challenge..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Layer</label>
                <select
                  value={layer}
                  onChange={(e) => setLayer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {layers.map(l => (
                    <option key={l.value} value={l.value}>
                      {l.icon} {l.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Duration</label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={21}>21 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Points Reward</label>
              <div className="flex items-center gap-2">
                {[25, 50, 75, 100].map(pts => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => setPointsReward(pts)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pointsReward === pts
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {pts} pts
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !description.trim()}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Challenge'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
