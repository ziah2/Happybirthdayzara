import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../lib/database.types';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}

export function RequireVerified({ children }: { children: ReactNode }) {
  const { loading, session, isVerified } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!session) return <Navigate to="/login" replace />;
  if (!isVerified) return <Navigate to="/verify-email" replace />;
  return <>{children}</>;
}

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { loading, profile } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!profile || !roles.includes(profile.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export function FullScreenLoader() {
  return (
    <div className="center-screen">
      <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(37,99,235,0.25)' }} />
    </div>
  );
}
