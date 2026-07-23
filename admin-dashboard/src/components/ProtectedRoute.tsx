import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export function ProtectedRoute() {
  const { admin } = useAuth();
  if (!admin) return <Navigate to="/login" replace />;
  return <Outlet />;
}
