"use client";
import React, {useState, useEffect} from 'react';
import {supabaseClient} from '../lib/supabaseClient';
import Card from './ui/Card';
import Button from './ui/Button';

type Metrics = {
  R: number;
  L: number;
  G: number;
  C: number;
  A: number;
  n: number;
};

const metricInfo = {
  R: {
    name: 'Resources',
    emoji: '💰',
    description: 'Available resources, energy, or capacity in the system',
    color: 'from-amber-500 to-yellow-400',
    min: 0,
    max: 1000,
    step: 10
  },
  L: {
    name: 'Local Operating System',
    emoji: '🏠',
    description: 'Internal stability and personal grounding (0-10)',
    color: 'from-blue-500 to-cyan-400',
    min: 0,
    max: 10,
    step: 1
  },
  G: {
    name: 'Global Operating System',
    emoji: '🌍',
    description: 'External environment and social context stability (0-10)',
    color: 'from-green-500 to-emerald-400',
    min: 0,
    max: 10,
    step: 1
  },
  C: {
    name: 'Coupling',
    emoji: '🔗',
    description: 'Degree of interdependence between systems (0.1-10)',
    color: 'from-purple-500 to-violet-400',
    min: 0.1,
    max: 10,
    step: 0.1
  },
  A: {
    name: 'Agreement',
    emoji: '🤝',
    description: 'Alignment between local and global systems (0-1)',
    color: 'from-pink-500 to-rose-400',
    min: 0,
    max: 1,
    step: 0.01
  },
  n: {
    name: 'Scaling Factor',
    emoji: '📊',
    description: 'Multiplier for agreement effect (1-3)',
    color: 'from-indigo-500 to-blue-400',
    min: 1,
    max: 3,
    step: 1
  }
};

function getStabilityLevel(stability: number | null, isInvalid: boolean): {label: string; color: string; emoji: string} {
  if (isInvalid || stability === null || !isFinite(stability)) {
    return {label: 'Invalid Input', color: 'text-gray-500', emoji: '⚠️'};
  }
  if (stability >= 500) return {label: 'Excellent', color: 'text-green-600', emoji: '🌟'};
  if (stability >= 200) return {label: 'Very Good', color: 'text-emerald-600', emoji: '✨'};
  if (stability >= 100) return {label: 'Good', color: 'text-blue-600', emoji: '👍'};
  if (stability >= 50) return {label: 'Moderate', color: 'text-yellow-600', emoji: '⚖️'};
  if (stability >= 20) return {label: 'Low', color: 'text-orange-600', emoji: '⚠️'};
  return {label: 'Critical', color: 'text-red-600', emoji: '🚨'};
}

export default function StabilityCalculator() {
  const [metrics, setMetrics] = useState<Metrics>({R: 100, L: 5, G: 5, C: 1, A: 0.5, n: 1});
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const {data} = await supabaseClient().auth.getSession();
      setIsAuthenticated(!!data?.session?.user);
    }
    checkAuth();
  }, []);

  function setVal<K extends keyof Metrics>(k: K, v: number) {
    setMetrics((s) => ({...s, [k]: v}));
    setResult(null);
    setSaved(false);
    setError(null);
  }

  function getDenominator(): number {
    const {L, G, C, A, n} = metrics;
    return Math.abs(L - G) + C - (A * n);
  }

  function isInvalidFormula(): boolean {
    return getDenominator() <= 0;
  }

  function previewStability(): number | null {
    if (isInvalidFormula()) return null;
    const {R, L, G} = metrics;
    return (R * (L + G)) / getDenominator();
  }

  async function compute() {
    setLoading(true);
    setResult(null);
    setSaved(false);
    setSavedId(null);
    setError(null);
    
    if (isInvalidFormula()) {
      setError('Invalid input: The denominator must be greater than 0. Try increasing Coupling (C) or reducing Agreement (A).');
      setLoading(false);
      return;
    }
    
    try {
      const {data: sessionData} = await supabaseClient().auth.getSession();
      const user_id = sessionData?.session?.user?.id ?? null;

      const res = await fetch('/api/stability', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...metrics, user_id})
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        setError('Server returned an invalid response. Please try again later.');
        return;
      }
      
      if (res.ok) {
        setResult(data.stability ?? null);
        setSaved(true);
        setSavedId(data.id ?? null);
      } else {
        setError(data.error || 'Failed to calculate stability. Please try again.');
        console.error(data);
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const preview = previewStability();
  const displayValue = result ?? preview;
  const invalid = isInvalidFormula();
  const level = getStabilityLevel(displayValue, invalid);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧮</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Stability Calculator</h3>
              <p className="text-sm text-gray-600">Model your system stability using our proprietary formula</p>
            </div>
          </div>
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
          >
            {showFormula ? '🔽 Hide' : '📐 Show'} Formula
          </button>
        </div>

        {showFormula && (
          <div className="mb-6 p-4 bg-white rounded-lg border border-indigo-200">
            <h4 className="font-semibold text-gray-800 mb-2">Stability Formula</h4>
            <div className="text-center py-4">
              <div className="text-2xl font-mono text-indigo-700">
                S = R × (L + G) / (|L - G| + C - A × n)
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-600 mt-4">
              <div><strong>S</strong> = Stability score</div>
              <div><strong>R</strong> = Resources</div>
              <div><strong>L</strong> = Local OS</div>
              <div><strong>G</strong> = Global OS</div>
              <div><strong>C</strong> = Coupling</div>
              <div><strong>A × n</strong> = Agreement factor</div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚙️</span> Input Parameters
          </h4>
          <div className="space-y-5">
            {(Object.keys(metricInfo) as (keyof Metrics)[]).map((key) => {
              const info = metricInfo[key];
              return (
                <div key={key} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{info.emoji}</span>
                      <div>
                        <span className="font-medium text-gray-800">{info.name}</span>
                        <span className="text-gray-500 ml-2">({key})</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${info.color} text-white font-bold text-sm`}>
                      {metrics[key]}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">{info.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{info.min}</span>
                    <input
                      aria-label={`${key} slider`}
                      type="range"
                      min={info.min}
                      max={info.max}
                      step={info.step}
                      value={metrics[key]}
                      onChange={(e) => setVal(key, Number(e.target.value))}
                      className="flex-1 h-2 appearance-none rounded-full bg-gray-200 cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs text-gray-400">{info.max}</span>
                    <input
                      aria-label={`${key} numeric`}
                      type="number"
                      min={info.min}
                      max={info.max}
                      step={info.step}
                      className="w-20 border border-gray-300 rounded-lg px-2 py-1 text-center text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={metrics[key]}
                      onChange={(e) => setVal(key, Number(e.target.value))}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 text-white">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>📊</span> {result !== null ? 'Calculated Stability' : 'Live Preview'}
            </h4>
            
            <div className="text-center py-6">
              <div className="relative inline-block">
                <div className={`w-40 h-40 rounded-full border-8 ${invalid ? 'border-red-700' : 'border-slate-700'} flex items-center justify-center bg-gradient-to-br ${invalid ? 'from-red-800 to-red-900' : 'from-slate-700 to-slate-800'}`}>
                  <div className="text-center">
                    <div className="text-4xl font-bold">
                      {invalid ? '—' : (displayValue !== null ? displayValue.toFixed(1) : '—')}
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {invalid ? 'Fix inputs' : (result !== null ? 'Final Score' : 'Preview')}
                    </div>
                  </div>
                </div>
                <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-white ${level.color} font-semibold text-sm whitespace-nowrap`}>
                  {level.emoji} {level.label}
                </div>
              </div>
            </div>
            
            {invalid && (
              <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-sm text-red-200">
                <strong>Invalid Configuration:</strong> The denominator (|L - G| + C - A×n) must be greater than 0. 
                Try increasing Coupling or reducing Agreement.
              </div>
            )}

            <div className="mt-8 space-y-3 text-sm">
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg px-4 py-2">
                <span className="text-slate-300">Combined Power (L + G)</span>
                <span className="font-mono font-bold">{metrics.L + metrics.G}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg px-4 py-2">
                <span className="text-slate-300">Imbalance |L - G|</span>
                <span className="font-mono font-bold">{Math.abs(metrics.L - metrics.G)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg px-4 py-2">
                <span className="text-slate-300">Agreement Effect (A × n)</span>
                <span className="font-mono font-bold">{(metrics.A * metrics.n).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-700/50 rounded-lg px-4 py-2">
                <span className="text-slate-300">Denominator</span>
                <span className="font-mono font-bold">
                  {(Math.abs(metrics.L - metrics.G) + metrics.C - metrics.A * metrics.n).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="space-y-4">
              <Button 
                onClick={compute} 
                disabled={loading}
                className="w-full py-3 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Computing & Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🧮 Calculate & Save
                  </span>
                )}
              </Button>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-medium text-red-800">Error</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {saved && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-medium text-green-800">Result Saved!</p>
                    <p className="text-sm text-green-600">
                      {isAuthenticated 
                        ? 'Your stability calculation has been saved to your profile.' 
                        : 'Saved anonymously. Sign in to track your history.'}
                    </p>
                    {savedId && (
                      <p className="text-xs text-green-500 mt-1">Record ID: {savedId}</p>
                    )}
                  </div>
                </div>
              )}

              {!isAuthenticated && !saved && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xl">💡</span>
                  <p className="text-sm text-amber-700">
                    Sign in to save your calculations and track your stability over time.
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>💡</span> Tips for Better Stability
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Increase Resources (R)</strong> to boost overall stability capacity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Balance L and G</strong> to minimize the |L - G| imbalance penalty</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span><strong>Increase Agreement (A)</strong> to reduce the denominator and increase stability</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-0.5">⚠</span>
                <span><strong>Watch Coupling (C)</strong> - lower coupling generally means better stability</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
