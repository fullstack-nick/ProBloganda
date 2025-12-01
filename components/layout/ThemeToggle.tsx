'use client';

import { useState } from 'react';

type Theme = 'light' | 'dark';

type ThemeToggleProps = {
  initialTheme: Theme;
};

export function ThemeToggle({ initialTheme }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function toggleTheme() {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';

      // flip the class on <html>
      document.documentElement.classList.toggle('dark', next === 'dark');

      // store preference in a cookie for the server
      document.cookie = `theme=${next}; path=/; max-age=31536000`;

      return next;
    });
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center h-9 px-3 rounded-full border text-xs sm:text-sm gap-1 select-none cursor-pointer whitespace-nowrap"
      aria-label="Toggle theme"
    >
      <span className="sm:hidden">
        {isDark ? '🌞' : '🌙'}
      </span>
      <span className="hidden sm:inline">
        {isDark ? '🌞 Light' : '🌙 Dark'}
      </span>
    </button>
  );
}
