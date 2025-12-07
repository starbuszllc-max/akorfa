import '../styles/globals.css';
import React from 'react';
import Header from '../components/ui/Header';

export const metadata = {
  title: 'Akorfa',
  description: 'Akorfa — Human Stack platform for self-discovery and growth'
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text">
        <Header />
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </body>
    </html>
  );
}
