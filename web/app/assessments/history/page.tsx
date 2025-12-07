'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../../../lib/supabaseClient';
import Loading from '../../../components/ui/Loading';
import ErrorMessage from '../../../components/ui/ErrorMessage';
import ProgressBar from '../../../components/ui/ProgressBar';

interface Assessment {
  id: string;
  userId: string;
  layerScores: Record<string, number>;
  overallScore: number;
  insights: string | null;
  createdAt: string;
}

const layerNames = ['environment', 'biological', 'internal', 'cultural', 'social', 'conscious', 'existential'];
const layerDisplayNames: Record<string, string> = {
  environment: 'Environment',
  biological: 'Biological',
  internal: 'Internal',
  cultural: 'Cultural',
  social: 'Social',
  conscious: 'Conscious',
  existential: 'Existential'
};
const layerColors: Record<string, 'green' | 'blue' | 'purple' | 'orange' | 'indigo'> = {
  environment: 'green',
  biological: 'blue',
  internal: 'purple',
  cultural: 'orange',
  social: 'indigo',
  conscious: 'purple',
  existential: 'orange'
};

export default function AssessmentHistoryPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  async function fetchAssessments() {
    setLoading(true);
    setError(null);

    try {
      let userId = localStorage.getItem('demo_user_id');
      
      if (!userId) {
        const client = supabaseClient();
        const { data: session } = await client.auth.getSession();
        userId = session?.session?.user?.id || null;
      }

      if (!userId) {
        setLoading(false);
        return;
      }

      const res = await fetch('/api/assessments');
      const data = await res.json();

      if (data.assessments) {
        const userAssessments = data.assessments.filter(
          (a: Assessment) => a.userId === userId
        );
        setAssessments(userAssessments);
        if (userAssessments.length > 0) {
          setSelectedAssessment(userAssessments[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }

  function calculateTrend(layer: string): { value: number; isPositive: boolean } | null {
    if (assessments.length < 2) return null;
    
    const latest = assessments[0]?.layerScores?.[layer] || 0;
    const previous = assessments[1]?.layerScores?.[layer] || 0;
    
    if (previous === 0) return null;
    
    const change = ((latest - previous) / previous) * 100;
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 };
  }

  if (loading) {
    return <Loading message="Loading assessment history..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={fetchAssessments} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessment History</h1>
          <p className="text-gray-500 mt-1">Track your growth across all 7 layers over time</p>
        </div>
        <Link
          href="/assessments"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No assessments yet</h2>
          <p className="text-gray-500 mb-6">Take your first assessment to start tracking your progress</p>
          <Link
            href="/assessments"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Take Assessment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Past Assessments</h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {assessments.map((assessment) => (
                  <button
                    key={assessment.id}
                    onClick={() => setSelectedAssessment(assessment)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedAssessment?.id === assessment.id
                        ? 'bg-indigo-50 border-2 border-indigo-300'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-800">
                        Score: {Number(assessment.overallScore).toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(assessment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedAssessment && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-lg">Assessment Details</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedAssessment.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Overall Score</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {Number(selectedAssessment.overallScore).toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Layer Scores</h4>
                  {layerNames.map((layer) => {
                    const score = selectedAssessment.layerScores?.[layer] || 0;
                    const trend = calculateTrend(layer);
                    return (
                      <div key={layer} className="flex items-center gap-4">
                        <div className="w-28 text-sm text-gray-600">{layerDisplayNames[layer]}</div>
                        <div className="flex-1">
                          <ProgressBar
                            value={Number(score)}
                            max={10}
                            showPercentage={false}
                            color={layerColors[layer] || 'indigo'}
                            size="md"
                          />
                        </div>
                        <div className="w-16 text-right">
                          <span className="font-medium text-gray-800">{Number(score).toFixed(1)}</span>
                          <span className="text-gray-400">/10</span>
                        </div>
                        {trend && (
                          <div className={`w-16 text-right text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '+' : '-'}{trend.value}%
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedAssessment.insights && (
                  <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-800 mb-2">Insights</h4>
                    <p className="text-indigo-700 text-sm">{selectedAssessment.insights}</p>
                  </div>
                )}
              </div>
            )}

            {assessments.length >= 2 && (
              <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
                <h3 className="font-semibold text-gray-800 mb-4">Progress Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {layerNames.slice(0, 4).map((layer) => {
                    const trend = calculateTrend(layer);
                    const latest = assessments[0]?.layerScores?.[layer] || 0;
                    return (
                      <div key={layer} className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">{layerDisplayNames[layer]}</p>
                        <p className="text-xl font-bold text-gray-800">{Number(latest).toFixed(1)}</p>
                        {trend && (
                          <p className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '↑' : '↓'} {trend.value}%
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
