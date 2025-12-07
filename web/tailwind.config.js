module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./pages/**/*.{ts,tsx}", "./components/ui/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          500: '#6366f1',
          600: '#6366f1'
        },
        secondary: {
          500: '#10b981'
        },
        accent: {
          500: '#f59e0b'
        },
        bg: '#f9fafb',
        surface: '#ffffff',
        text: '#111827',
        'text-secondary': '#6b7280',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
