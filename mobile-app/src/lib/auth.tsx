import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

interface WorkerProfile {
  id: string;
  clockNumber: string;
  fullName: string;
  photoUrl: string | null;
  languagePref: 'en' | 'mr';
}

interface AuthContextValue {
  worker: WorkerProfile | null;
  loading: boolean;
  loginWithPassword: (clockNumber: string, password: string) => Promise<void>;
  requestOtp: (clockNumber: string) => Promise<void>;
  verifyOtp: (clockNumber: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem('canteen_worker_profile');
      if (raw) setWorker(JSON.parse(raw));
      setLoading(false);
    })();
  }, []);

  async function persist(data: { accessToken: string; refreshToken: string; worker: WorkerProfile }) {
    await AsyncStorage.multiSet([
      ['canteen_worker_access_token', data.accessToken],
      ['canteen_worker_refresh_token', data.refreshToken],
      ['canteen_worker_profile', JSON.stringify(data.worker)],
    ]);
    setWorker(data.worker);
  }

  async function loginWithPassword(clockNumber: string, password: string) {
    const { data } = await api.post('/auth/worker/login', { clockNumber, password });
    await persist(data);
  }

  async function requestOtp(clockNumber: string) {
    await api.post('/auth/worker/otp/request', { clockNumber });
  }

  async function verifyOtp(clockNumber: string, otp: string) {
    const { data } = await api.post('/auth/worker/otp/verify', { clockNumber, otp });
    await persist(data);
  }

  async function logout() {
    await AsyncStorage.multiRemove(['canteen_worker_access_token', 'canteen_worker_refresh_token', 'canteen_worker_profile']);
    setWorker(null);
  }

  return (
    <AuthContext.Provider value={{ worker, loading, loginWithPassword, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
