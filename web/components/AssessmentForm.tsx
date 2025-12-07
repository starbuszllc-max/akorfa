 'use client';
import React, {useState} from 'react';
import {supabaseClient} from '../lib/supabaseClient';
import Card from './ui/Card';
import Button from './ui/Button';

const layers = [
  'environment',
  'bio',
  'internal',
  'cultural',
  'social',
  'conscious',
  'existential'
] as const;

export default function AssessmentForm() {
  const initial: Record<string, number> = {};
  layers.forEach((l) => (initial[l] = 5));

  const [values, setValues] = useState<Record<string, number>>(initial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  function setLayerValue(layer: string, v: number) {
    setValues((s) => ({...s, [layer]: v}));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      // Include authenticated user id when available
      const {data: sessionData} = await supabaseClient.auth.getSession();
      const user_id = sessionData?.session?.user?.id ?? null;

      const resp = await fetch('/api/assessments', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({layer_scores: values, user_id})
      });
      const data = await resp.json();
      if (resp.ok) setResult(data.overall_score ?? null);
      else console.error(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {layers.map((layer) => (
        <Card key={layer} className="flex flex-col">
          <div className="flex items-center justify-between">
            <label className="font-medium capitalize">{layer.replace('_', ' ')}</label>
            <div className="text-sm text-text-secondary">{values[layer]}</div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <input
              aria-label={`${layer} slider`}
              type="range"
              min={0}
              max={10}
              value={values[layer]}
              onChange={(e) => setLayerValue(layer, Number(e.target.value))}
              className="w-full"
            />
            <input
              aria-label={`${layer} numeric input`}
              type="number"
              min={0}
              max={10}
              value={values[layer]}
              onChange={(e) => setLayerValue(layer, Math.max(0, Math.min(10, Number(e.target.value))))}
              className="w-16 border rounded px-2 py-1 text-center"
            />
          </div>

          <div className="text-xs text-text-secondary mt-2" title="Layer description">
            {layer === 'environment' && 'Physical and digital environment (space, tools, algorithms).'}
            {layer === 'bio' && 'Sleep, nutrition, exercise, and physical health.'}
            {layer === 'internal' && 'Beliefs, trauma, cognitive patterns.'}
            {layer === 'cultural' && 'Shared values, norms, and cultural programming.'}
            {layer === 'social' && 'Relationships, roles, and daily interactions.'}
            {layer === 'conscious' && 'Metacognition, intention, and collective alignment.'}
            {layer === 'existential' && 'Purpose, meaning, and legacy.'}
          </div>
        </Card>
      ))}

      <div>
        <Button type="submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit Assessment'}</Button>
      </div>

      {result !== null && (
        <div className="p-4 bg-white border rounded-md">
          <strong>Overall Score:</strong> {result}
        </div>
      )}
    </form>
  );
}
