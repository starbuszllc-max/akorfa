import React, {useEffect, useState} from 'react';
import {supabaseClient} from '../../lib/supabaseClient';

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const {data, error} = await supabaseClient.from('assessments').select('*').order('created_at', {ascending: false}).limit(200);
      if (error) {
        console.error(error);
        setAssessments([]);
      } else setAssessments(data ?? []);
      setLoading(false);
    })();
  }, []);

  function downloadCSV() {
    const rows = assessments.map((a) => ({id: a.id, user_id: a.user_id, overall_score: a.overall_score, created_at: a.created_at, layer_scores: JSON.stringify(a.layer_scores)}));
    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map((r) => Object.values(r).map((v) => '"' + String(v).replace(/"/g, '""') + '"').join(','))].join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessments.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main>
      <h1 className="text-2xl font-bold mb-4">Assessments (Admin)</h1>
      <div className="mb-4">
        <button className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={downloadCSV} disabled={loading || assessments.length === 0}>
          Download CSV
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <div key={a.id} className="p-3 bg-white rounded shadow-sm">
              <div className="text-sm text-gray-500">{new Date(a.created_at).toLocaleString()}</div>
              <div className="font-medium">Score: {a.overall_score}</div>
              <pre className="text-xs mt-2 bg-gray-50 p-2 rounded">{JSON.stringify(a.layer_scores, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
