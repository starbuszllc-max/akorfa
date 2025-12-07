 'use client';
import React, {useState} from 'react';
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

export default function StabilityCalculator() {
  const [metrics, setMetrics] = useState<Metrics>({R: 100, L: 5, G: 5, C: 1, A: 0.5, n: 1});
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function setVal<K extends keyof Metrics>(k: K, v: number) {
    setMetrics((s) => ({...s, [k]: v}));
  }

  async function compute() {
    setLoading(true);
    setResult(null);
    try {
      // Include authenticated user id when available
      const {data: sessionData} = await supabaseClient.auth.getSession();
      const user_id = sessionData?.session?.user?.id ?? null;

      const res = await fetch('/api/stability', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({...metrics, user_id})
      });
      const data = await res.json();
      if (res.ok) setResult(data.stability ?? null);
      else console.error(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h3 className="font-semibold mb-2">Stability Calculator</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">R (Resources): {metrics.R}</label>
            <div className="flex items-center gap-3 mt-2">
              <input aria-label="R slider" type="range" min={0} max={1000} value={metrics.R} onChange={(e) => setVal('R', Number(e.target.value))} className="w-full" />
              <input aria-label="R numeric" type="number" className="w-24 border rounded px-2 py-1 text-center" value={metrics.R} onChange={(e) => setVal('R', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">L (Local OS 0-10): {metrics.L}</label>
            <div className="flex items-center gap-3 mt-2">
              <input aria-label="L slider" type="range" min={0} max={10} value={metrics.L} onChange={(e) => setVal('L', Number(e.target.value))} className="w-full" />
              <input aria-label="L numeric" type="number" className="w-24 border rounded px-2 py-1 text-center" value={metrics.L} onChange={(e) => setVal('L', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">G (Global OS 0-10): {metrics.G}</label>
            <div className="flex items-center gap-3 mt-2">
              <input aria-label="G slider" type="range" min={0} max={10} value={metrics.G} onChange={(e) => setVal('G', Number(e.target.value))} className="w-full" />
              <input aria-label="G numeric" type="number" className="w-24 border rounded px-2 py-1 text-center" value={metrics.G} onChange={(e) => setVal('G', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">C (Coupling 0.1-10): {metrics.C}</label>
            <div className="flex items-center gap-3 mt-2">
              <input aria-label="C slider" type="range" min={0.1} max={10} step={0.1} value={metrics.C} onChange={(e) => setVal('C', Number(e.target.value))} className="w-full" />
              <input aria-label="C numeric" type="number" className="w-24 border rounded px-2 py-1 text-center" value={metrics.C} onChange={(e) => setVal('C', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">A (Agreement 0-1): {metrics.A}</label>
            <div className="flex items-center gap-3 mt-2">
              <input aria-label="A slider" type="range" min={0} max={1} step={0.01} value={metrics.A} onChange={(e) => setVal('A', Number(e.target.value))} className="w-full" />
              <input aria-label="A numeric" type="number" className="w-24 border rounded px-2 py-1 text-center" value={metrics.A} onChange={(e) => setVal('A', Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label className="block text-sm">n (Scaling 1-3): {metrics.n}</label>
            <div className="flex items-center gap-3 mt-2">
              <input aria-label="n slider" type="range" min={1} max={3} step={1} value={metrics.n} onChange={(e) => setVal('n', Number(e.target.value))} className="w-full" />
              <input aria-label="n numeric" type="number" className="w-24 border rounded px-2 py-1 text-center" value={metrics.n} onChange={(e) => setVal('n', Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div>
          <Button onClick={compute} disabled={loading}>{loading ? 'Computing…' : 'Compute Stability'}</Button>
        </div>

        {result !== null && (
          <div className="mt-3 p-3 border rounded bg-gray-50">
            <strong>Stability S:</strong> {result}
          </div>
        )}
      </div>
    </Card>
  );
}
