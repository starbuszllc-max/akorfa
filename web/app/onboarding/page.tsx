'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft, Check, Sparkles, Target, Users, Brain, Heart, Zap } from 'lucide-react';

const layers = [
  { id: 'environment', name: 'Environment', icon: '🌍', color: 'bg-green-500', description: 'Your physical surroundings and spaces' },
  { id: 'biological', name: 'Biological', icon: '🧬', color: 'bg-blue-500', description: 'Physical health and body wellness' },
  { id: 'internal', name: 'Internal', icon: '🧠', color: 'bg-purple-500', description: 'Thoughts, emotions, and mental patterns' },
  { id: 'cultural', name: 'Cultural', icon: '🎭', color: 'bg-orange-500', description: 'Values, beliefs, and traditions' },
  { id: 'social', name: 'Social', icon: '👥', color: 'bg-pink-500', description: 'Relationships and community' },
  { id: 'conscious', name: 'Conscious', icon: '✨', color: 'bg-indigo-500', description: 'Awareness and mindfulness' },
  { id: 'existential', name: 'Existential', icon: '🌌', color: 'bg-red-500', description: 'Purpose and meaning in life' },
];

const goals = [
  { id: 'self-discovery', label: 'Self-Discovery', icon: Brain, description: 'Understand myself better' },
  { id: 'stress-management', label: 'Stress Management', icon: Heart, description: 'Reduce stress and anxiety' },
  { id: 'relationships', label: 'Better Relationships', icon: Users, description: 'Improve connections with others' },
  { id: 'purpose', label: 'Find Purpose', icon: Target, description: 'Discover my life direction' },
  { id: 'productivity', label: 'Boost Productivity', icon: Zap, description: 'Get more done each day' },
  { id: 'mindfulness', label: 'Mindfulness', icon: Sparkles, description: 'Be more present' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [focusLayers, setFocusLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) ? prev.filter(g => g !== goalId) : [...prev, goalId]
    );
  };

  const toggleLayer = (layerId: string) => {
    setFocusLayers(prev => 
      prev.includes(layerId) ? prev.filter(l => l !== layerId) : [...prev, layerId]
    );
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          goals: selectedGoals,
          focusLayers,
        }),
      });
      
      const data = await res.json();
      if (data.userId) {
        localStorage.setItem('demo_user_id', data.userId);
        router.push('/dashboard');
      } else if (data.error) {
        alert(`Signup Error: ${data.error}\n\nCode: ${data.code || 'N/A'}\n\nHint: ${data.hint || 'N/A'}`);
        console.error('Onboarding error details:', data);
      }
    } catch (err) {
      console.error('Onboarding error:', err);
      alert('Network error - please try again');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center mb-8">
          {[...Array(totalSteps)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                i < step ? 'bg-indigo-600 text-white' : 
                i === step ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 dark:ring-indigo-900' : 
                'bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
              }`}>
                {i < step ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              {i < totalSteps - 1 && (
                <div className={`w-16 h-1 mx-2 rounded ${i < step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 animate-fade-in">
          {step === 0 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to Akorfa
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
                Your journey to self-discovery begins here. Let&apos;s personalize your experience to help you grow across all seven layers of your being.
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full max-w-xs mx-auto block px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl text-center text-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                What brings you here, {name || 'friend'}?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Select all that resonate with you
              </p>
              <div className="grid grid-cols-2 gap-4">
                {goals.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoals.includes(goal.id);
                  return (
                    <button
                      key={goal.id}
                      onClick={() => toggleGoal(goal.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' 
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                      <div className={`font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                        {goal.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{goal.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Which layers do you want to focus on?
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">
                Choose the areas you&apos;d like to develop first
              </p>
              <div className="space-y-3">
                {layers.map((layer) => {
                  const isSelected = focusLayers.includes(layer.id);
                  return (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' 
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${layer.color} flex items-center justify-center text-2xl`}>
                        {layer.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`font-semibold ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-gray-900 dark:text-white'}`}>
                          {layer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{layer.description}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 dark:border-slate-500'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                <Check className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                You&apos;re all set, {name || 'friend'}!
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                We&apos;ve personalized your experience based on your goals. Your AI coach will provide daily insights tailored to your journey.
              </p>
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-4 mb-6">
                <div className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-2">Your Focus Areas</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {focusLayers.map(layerId => {
                    const layer = layers.find(l => l.id === layerId);
                    return layer ? (
                      <span key={layerId} className="px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300">
                        {layer.icon} {layer.name}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : <div />}
            
            {step < totalSteps - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 0 && !name}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {loading ? 'Setting up...' : 'Start My Journey'}
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
