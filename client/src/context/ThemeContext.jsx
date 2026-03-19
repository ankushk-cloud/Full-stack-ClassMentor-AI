import React, { createContext, useContext, useState, useLayoutEffect } from 'react';

const ThemeContext = createContext(null);

const themes = {
  dark: {
    bg: '#0f0f0f',
    surface: '#1a1a1a',
    surfaceHover: '#1f1f1f',
    text: '#e4e4e4',
    textMuted: '#888888',
    border: '#333333',
    inputBg: '#0f0f0f',
    accent: '#238636',
    accentHover: '#2ea043',
    error: '#f85149',
    link: '#58a6ff',
    userBubble: '#238636',
    assistantBubble: '#1a1a1a',
    overlay: 'rgba(0,0,0,0.6)',
    modalBg: '#1a1a1a',
  },
  light: {
    bg: '#f6f8fa',
    surface: '#ffffff',
    surfaceHover: '#f0f0f0',
    text: '#1f2328',
    textMuted: '#656d76',
    border: '#d0d7de',
    inputBg: '#ffffff',
    accent: '#238636',
    accentHover: '#2ea043',
    error: '#cf222e',
    link: '#0969da',
    userBubble: '#238636',
    assistantBubble: '#eaeef2',
    overlay: 'rgba(0,0,0,0.4)',
    modalBg: '#ffffff',
  },
};

const STORAGE_KEY = 'classmentor-theme';

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  });

  const theme = themes[themeMode];
  const isDark = themeMode === 'dark';

  useLayoutEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeMode);
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
