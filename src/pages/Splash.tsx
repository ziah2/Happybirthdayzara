import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Splash() {
  const { loading, session, isVerified } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (!session) navigate('/login', { replace: true });
      else if (!isVerified) navigate('/verify-email', { replace: true });
      else navigate('/dashboard', { replace: true });
    }, 900);
    return () => clearTimeout(t);
  }, [loading, session, isVerified, navigate]);

  return (
    <div className="splash">
      <img src="/oaustech-logo.png" alt="OAUSTECH" className="splash-logo-img" />
      <h1 style={{ fontSize: 26 }}>OAUSTECH Student Hub</h1>
      <p className="muted">Your campus, all in one place</p>
      <div
        className="spinner"
        style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(37,99,235,0.25)', marginTop: 8 }}
      />
    </div>
  );
}
