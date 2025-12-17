import '../styles/globals.css';
import '../styles/layered-icons.css';
import React, { Suspense } from 'react';
import { ThemeProvider } from '../lib/ThemeContext';
import { HeaderProvider } from '../lib/HeaderContext';
import ConditionalHeader from '../components/ui/ConditionalHeader';
import EnhancedHeader from '../components/ui/EnhancedHeader';
import Footer from '../components/ui/Footer';
import InstallPrompt from '../components/pwa/InstallPrompt';
import BottomNavBar from '../components/ui/BottomNavBar';
import LoadingScreen from '../components/ui/LoadingScreen';
import ResponsiveMainContent from '../components/ui/ResponsiveMainContent';

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
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Akorfa" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900 amoled:bg-black text-gray-900 dark:text-gray-100 flex flex-col transition-colors duration-200">
        <ThemeProvider>
          <HeaderProvider>
            <ConditionalHeader />
            <EnhancedHeader />
            <ResponsiveMainContent>
              <Suspense fallback={<LoadingScreen />}>
                {children}
              </Suspense>
            </ResponsiveMainContent>
            <Footer />
            <BottomNavBar />
            <InstallPrompt />
          </HeaderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
