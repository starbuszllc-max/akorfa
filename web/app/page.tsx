'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../lib/supabaseClient';

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = supabaseClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
  }, []);

  const features = [
    {
      icon: '🔍',
      title: 'Self-Assessment',
      description: 'Explore your 7 layers of being — from environment to existential purpose.'
    },
    {
      icon: '📊',
      title: 'Stability Metrics',
      description: 'Calculate your system stability using our proprietary formula.'
    },
    {
      icon: '🌱',
      title: 'Growth Tracking',
      description: 'Monitor your Akorfa score and watch your personal development over time.'
    },
    {
      icon: '👥',
      title: 'Community Feed',
      description: 'Share insights and connect with others on their growth journey.'
    }
  ];

  const layers = [
    { name: 'Environment', color: 'bg-green-500' },
    { name: 'Biological', color: 'bg-blue-500' },
    { name: 'Internal', color: 'bg-purple-500' },
    { name: 'Cultural', color: 'bg-yellow-500' },
    { name: 'Social', color: 'bg-pink-500' },
    { name: 'Conscious', color: 'bg-indigo-500' },
    { name: 'Existential', color: 'bg-red-500' }
  ];

  return (
    <main className="-mt-6 -mx-6">
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Discover Your Human Stack
          </h1>
          <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Akorfa helps you understand, measure, and grow across all 7 layers of your being.
          </p>
          {loading ? (
            <div className="h-12"></div>
          ) : user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/feed"
                className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Go to Feed
              </Link>
              <Link 
                href="/assessments"
                className="inline-block bg-indigo-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-indigo-400 transition-colors border border-indigo-400"
              >
                Take Assessment
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/signup"
                className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Get Started Free
              </Link>
              <Link 
                href="/login"
                className="inline-block bg-indigo-500 text-white font-semibold px-8 py-3 rounded-lg hover:bg-indigo-400 transition-colors border border-indigo-400"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">The 7 Layers of Being</h2>
          <p className="text-gray-600 text-center mb-10 max-w-2xl mx-auto">
            Our assessment framework explores every dimension of your human experience.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {layers.map((layer, index) => (
              <div 
                key={index}
                className={`${layer.color} text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm`}
              >
                {layer.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How Akorfa Works</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Stability Formula</h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            Our proprietary equation measures your system stability across all layers.
          </p>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl text-center">
            <div className="font-mono text-2xl md:text-3xl text-indigo-700 mb-4">
              S = R × (L + G) / (|L - G| + C - (A × n))
            </div>
            <p className="text-gray-600 text-sm">
              Where S = Stability, R = Resilience, L = Losses, G = Gains, C = Constants, A = Adjustments, n = iterations
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Join thousands of others exploring their human potential.
          </p>
          {!loading && !user && (
            <Link 
              href="/signup"
              className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Create Free Account
            </Link>
          )}
          {!loading && user && (
            <Link 
              href="/assessments"
              className="inline-block bg-white text-indigo-600 font-semibold px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Start Your Assessment
            </Link>
          )}
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="font-bold text-white text-xl mb-4">Akorfa</div>
          <p className="text-sm mb-6">Human Stack Platform for Self-Discovery</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/assessments" className="hover:text-white transition-colors">Assessments</Link>
            <Link href="/stability" className="hover:text-white transition-colors">Stability</Link>
            <Link href="/feed" className="hover:text-white transition-colors">Community</Link>
            <Link href="/profile" className="hover:text-white transition-colors">Profile</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
