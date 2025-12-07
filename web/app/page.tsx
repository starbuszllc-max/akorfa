import React from 'react';

export default function Home() {
  return (
    <main>
      <h1 className="text-3xl font-bold mb-4">Welcome to Akorfa</h1>
      <p className="text-gray-600">Scaffolded Next.js App Router — build your features here.</p>
      <section className="mt-6">
        <h2 className="text-xl font-semibold">Next steps</h2>
        <ul className="list-disc pl-6 mt-2 text-gray-700">
          <li>Wire Supabase auth</li>
          <li>Integrate `@akorfa/shared` scoring module</li>
          <li>Implement assessment UI</li>
        </ul>
      </section>
    </main>
  );
}
