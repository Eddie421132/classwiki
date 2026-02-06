import { useState, useEffect, useCallback } from 'react';

export type ThemeStyle = 'default' | 'glassmorphism' | 'aurora' | 'minimal' | 'warm';

const THEME_STORAGE_KEY = 'wiki-theme-style';

// 在模块加载时立即应用主题，避免闪烁
function applyThemeImmediately() {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeStyle;
    if (savedTheme && savedTheme !== 'default') {
      document.documentElement.classList.add(`theme-${savedTheme}`);
    }
  }
}

// 立即执行
applyThemeImmediately();

export function useTheme() {
  const [theme, setTheme] = useState<ThemeStyle>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeStyle) || 'default';
    }
    return 'default';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-glassmorphism', 'theme-aurora', 'theme-minimal', 'theme-warm');
    
    // Add new theme class
    if (theme !== 'default') {
      root.classList.add(`theme-${theme}`);
    }
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const changeTheme = useCallback((newTheme: ThemeStyle) => {
    setTheme(newTheme);
  }, []);

  return { theme, changeTheme };
}

export const themeOptions: { value: ThemeStyle; label: string; description: string }[] = [
  { value: 'default', label: '经典', description: '简洁优雅的默认主题' },
  { value: 'glassmorphism', label: '液态玻璃', description: 'iPhone风格流动透明效果' },
  { value: 'aurora', label: '极光', description: '梦幻渐变色彩流动' },
  { value: 'minimal', label: '极简', description: '纯净黑白极简风格' },
  { value: 'warm', label: '暖阳', description: '温暖舒适的暖色调' },
];
