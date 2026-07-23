import { useMemo, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { buildTheme } from './theme/theme';
import { AuthProvider } from './lib/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { LiveDashboard } from './pages/LiveDashboard';
import { Workers } from './pages/Workers';
import { Analytics } from './pages/Analytics';
import { Reports } from './pages/Reports';
import { Feedback } from './pages/Feedback';

const queryClient = new QueryClient();

export default function App() {
  const [mode, setMode] = useState<'light' | 'dark'>(() => (localStorage.getItem('canteen_theme_mode') as 'light' | 'dark') ?? 'light');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  function toggleMode() {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('canteen_theme_mode', next);
      return next;
    });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route
                  path="/"
                  element={
                    <Layout mode={mode} onToggleMode={toggleMode}>
                      <LiveDashboard />
                    </Layout>
                  }
                />
                <Route
                  path="/workers"
                  element={
                    <Layout mode={mode} onToggleMode={toggleMode}>
                      <Workers />
                    </Layout>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <Layout mode={mode} onToggleMode={toggleMode}>
                      <Analytics />
                    </Layout>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <Layout mode={mode} onToggleMode={toggleMode}>
                      <Reports />
                    </Layout>
                  }
                />
                <Route
                  path="/feedback"
                  element={
                    <Layout mode={mode} onToggleMode={toggleMode}>
                      <Feedback />
                    </Layout>
                  }
                />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
