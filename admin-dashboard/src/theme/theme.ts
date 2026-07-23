import { createTheme } from '@mui/material/styles';

export function buildTheme(mode: 'light' | 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1E6F5C' },
      secondary: { main: '#F4A300' },
      background: mode === 'dark' ? { default: '#0F1512', paper: '#151C18' } : { default: '#F6F8F7', paper: '#FFFFFF' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: ['"Inter"', 'system-ui', 'sans-serif'].join(','),
    },
  });
}
