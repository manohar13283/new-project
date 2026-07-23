import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';

export const colors = {
  primary: '#1E6F5C',
  secondary: '#F4A300',
  successBg: '#E7F6EC',
  errorBg: '#FDECEA',
};

interface AppThemeContextValue {
  mode: 'light' | 'dark';
  toggle: () => void;
  navigationTheme: Theme;
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);
  const mode = override ?? (systemScheme === 'dark' ? 'dark' : 'light');

  const navigationTheme = useMemo<Theme>(() => {
    const base = mode === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, primary: colors.primary } };
  }, [mode]);

  function toggle() {
    setOverride(mode === 'dark' ? 'light' : 'dark');
  }

  return <AppThemeContext.Provider value={{ mode, toggle, navigationTheme }}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(AppThemeContext);
  if (!ctx) throw new Error('useAppTheme must be used within ThemeProvider');
  return ctx;
}
