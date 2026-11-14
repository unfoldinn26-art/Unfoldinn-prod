'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  // Default force is light
  const [theme, setThemeState] = useState('light');
  const [mounted, setMounted] = useState(false);

  const applyThemeToDom = (target) => {
    document.documentElement.classList.toggle('dark', target === 'dark');
    document.documentElement.style.colorScheme = target;
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'color-scheme');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', target);
  };

  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('theme');
      const target = savedTheme === 'dark' ? 'dark' : 'light';
      setThemeState(target);
      applyThemeToDom(target);
    } catch (e) {
      // In case localStorage is blocked
    }
  }, []);

  const setTheme = (newTheme) => {
    const target = newTheme === 'dark' ? 'dark' : 'light';
    setThemeState(target);
    try {
      localStorage.setItem('theme', target);
      applyThemeToDom(target);
    } catch (e) {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
