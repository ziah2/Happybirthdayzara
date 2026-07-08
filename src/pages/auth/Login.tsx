import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Alert, Button, Card, Field, Input } from '../../components/ui';
import { ConfigNotice } from '../../components/layout/ConfigNotice';
import { isValidEmail } from '../../lib/utils';

export function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) return setError(error);
    navigate('/dashboard');
  }

  return (
    <div className="center-screen">
      <Card className="auth-card">
        <div className="center" style={{ marginBottom: 20 }}>
          <img src="/oaustech-logo.png" alt="OAUSTECH" className="auth-logo-img" />
          <h2 style={{ fontSize: 22 }}>Welcome back</h2>
          <p className="muted tiny">Sign in to OAUSTECH Student Hub</p>
        </div>
        <ConfigNotice />
        {error && <Alert tone="error">{error}</Alert>}
        <form onSubmit={submit}>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@student.oaustech.edu.ng" />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </Field>
          <div className="between" style={{ marginBottom: 16 }}>
            <span />
            <Link to="/forgot-password" className="tiny">
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" block loading={busy}>
            Login
          </Button>
        </form>
        <div className="center muted tiny" style={{ margin: '16px 0' }}>
          or
        </div>
        <Button variant="ghost" block onClick={() => signInWithGoogle()}>
          <span style={{ fontWeight: 700 }}>G</span> Continue with Google
        </Button>
        <p className="center tiny" style={{ marginTop: 18 }}>
          Don't have an account? <Link to="/signup">Create Account</Link>
        </p>
      </Card>
    </div>
  );
}
