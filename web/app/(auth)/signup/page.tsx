'use client';
import React, {useState} from 'react';
import {useRouter} from 'next/navigation';
import {supabaseClient} from '../../../lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const {data, error: signUpError} = await supabaseClient().auth.signUp({
        email,
        password
      });
      if (signUpError) {
        setMessage(signUpError.message);
      } else if (data.session) {
        router.push('/feed');
      } else if (data.user?.identities?.length === 0) {
        setMessage('An account with this email already exists. Please log in.');
      } else {
        setMessage('Check your email for a confirmation link.');
      }
    } catch (err: any) {
      setMessage(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-md shadow">
      <h1 className="text-xl font-bold mb-4">Sign Up</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-200 p-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-200 p-2"
            required
          />
        </div>

        {message && <div className="text-sm text-gray-700">{message}</div>}

        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md"
            disabled={loading}
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
      <div className="mt-4 text-sm">
        <a className="text-indigo-600" href="/login">
          Have an account? Log in
        </a>
      </div>
    </div>
  );
}
