import '../styles/globals.css';
import '../styles/layered-icons.css';
import React from 'react';
import { ThemeProvider } from '../lib/ThemeContext';
import EnhancedHeader from '../components/ui/EnhancedHeader';
import Footer from '../components/ui/Footer';
import InstallPrompt from '../components/pwa/InstallPrompt';
import BottomNavBar from '../components/ui/BottomNavBar';

export const metadata = {
  title: 'Akorfa',
  description: 'Akorfa — Human Stack platform for self-discovery and growth',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Akorfa'
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
  viewportFit: 'cover'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900 amoled:bg-black text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <EnhancedHeader />
          <main className="flex-1 pb-16">
            {children}
          </main>
          <Footer />
          <BottomNavBar />
          <InstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
