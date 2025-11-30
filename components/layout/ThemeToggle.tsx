'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem('theme') as Theme | null;
    const initial: Theme = stored ?? 'dark';

    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  function toggleTheme() {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('theme', next);
        document.documentElement.classList.toggle('dark', next === 'dark');
      }

      return next;
    });
  }

  if (!mounted) {
    return (
      <button
        type="button"
        className="inline-flex items-center justify-center h-9 px-3 rounded-full border text-xs sm:text-sm select-none cursor-pointer whitespace-nowrap"
        aria-label="Toggle theme"
      >
        Theme
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center h-9 px-3 rounded-full border text-xs sm:text-sm gap-1 select-none cursor-pointer whitespace-nowrap"
      aria-label="Toggle theme"
    >
      <span className="sm:hidden">
        {theme === 'dark' ? '🌞' : '🌙'}
      </span>
      <span className="hidden sm:inline">
        {theme === 'dark' ? '🌞 Light' : '🌙 Dark'}
      </span>
    </button>
  );
}
