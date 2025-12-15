'use client';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-900 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <img 
          src="/logo.png" 
          alt="Akorfa" 
          className="h-24 md:h-32 w-auto drop-shadow-lg animate-pulse"
        />
        <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
