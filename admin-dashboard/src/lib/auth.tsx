import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './api';

interface AdminUser {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CANTEEN_STAFF';
}

interface AuthContextValue {
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const raw = localStorage.getItem('canteen_admin_user');
    return raw ? JSON.parse(raw) : null;
  });

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/admin/login', { email, password });
    localStorage.setItem('canteen_admin_access_token', data.accessToken);
    localStorage.setItem('canteen_admin_user', JSON.stringify(data.admin));
    setAdmin(data.admin);
  }

  function logout() {
    localStorage.removeItem('canteen_admin_access_token');
    localStorage.removeItem('canteen_admin_user');
    setAdmin(null);
  }

  return <AuthContext.Provider value={{ admin, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
