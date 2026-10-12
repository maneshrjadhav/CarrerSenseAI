import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem('careersense_theme_mode') || localStorage.getItem('careersense_theme');
      if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
      return 'system';
    } catch {
      return 'light';
    }
  });

  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen to OS system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    try {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } catch {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);

  const resolvedTheme = useMemo(() => {
    if (themeMode === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return themeMode === 'dark' ? 'dark' : 'light';
  }, [themeMode, systemDark]);

  useEffect(() => {
    try {
      localStorage.setItem('careersense_theme_mode', themeMode);
      localStorage.setItem('careersense_theme', resolvedTheme);
    } catch {}

    const isDark = resolvedTheme === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    document.body.classList.toggle('dark-mode', isDark);
    document.body.setAttribute('data-theme', resolvedTheme);
  }, [themeMode, resolvedTheme]);

  const toggleTheme = () => {
    setThemeMode((prev) => {
      if (prev === 'system') {
        return resolvedTheme === 'dark' ? 'light' : 'dark';
      }
      return prev === 'dark' ? 'light' : 'dark';
    });
  };

  const setTheme = (mode) => {
    if (mode === 'dark' || mode === 'light' || mode === 'system') {
      setThemeMode(mode);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        themeMode,
        resolvedTheme,
        isDark: resolvedTheme === 'dark',
        toggleTheme,
        setTheme,
        setThemeMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'light',
      themeMode: 'light',
      resolvedTheme: 'light',
      isDark: false,
      toggleTheme: () => {},
      setTheme: () => {},
      setThemeMode: () => {}
    };
  }
  return context;
}

export default ThemeContext;

