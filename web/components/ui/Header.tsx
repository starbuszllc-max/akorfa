import React from 'react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-white shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg text-primary-600">Akorfa</Link>
        <nav className="space-x-4">
          <Link href="/assessments" className="text-sm text-text-secondary hover:text-primary-600">Assess</Link>
          <Link href="/stability" className="text-sm text-text-secondary hover:text-primary-600">Stability</Link>
          <Link href="/profile" className="text-sm text-text-secondary hover:text-primary-600">Profile</Link>
          <Link href="/admin/assessments" className="text-sm text-text-secondary hover:text-primary-600">Admin</Link>
          <Link href="/auth/login" className="text-sm text-text-secondary hover:text-primary-600">Login</Link>
        </nav>
      </div>
    </header>
  );
}
