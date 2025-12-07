import '../styles/globals.css';
import React from 'react';
import Header from '../components/ui/Header';
import Footer from '../components/ui/Footer';

export const metadata = {
  title: 'Akorfa',
  description: 'Akorfa — Human Stack platform for self-discovery and growth'
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <Header />
        <main className="flex-1">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
