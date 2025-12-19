'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ArrowRight, Mail, Lock, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Authentication service is not configured');
        return;
      }
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.user) {
        // Send verification email via Resend instead of Supabase
        try {
          const verificationLink = `${window.location.origin}/auth/callback?code=${data.session?.access_token || ''}`;
          
          await fetch('/api/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'verification',
              email,
              verificationUrl: verificationLink,
            }),
          });
        } catch (err) {
          console.error('Error sending verification email:', err);
        }

        if (data.session) {
          localStorage.setItem('demo_user_id', data.user.id);
        }
        setSuccess(true);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Check Your Email
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          We've sent a verification link to <span className="font-semibold text-green-600 dark:text-green-400">{email}</span>
        </p>
        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
          <p className="text-green-800 dark:text-green-200 text-sm">
            Click the link in your email to verify your account and continue to onboarding.
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Didn't receive the email? Check your spam folder or try signing up again.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create Your Account
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Start your journey of self-discovery
        </p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              minLength={6}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-green-600 dark:text-green-400 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
