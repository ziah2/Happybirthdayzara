import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Alert, Button, Card, Field, Input } from '../../components/ui';
import { ConfigNotice } from '../../components/layout/ConfigNotice';
import { isValidEmail } from '../../lib/utils';

export function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    setBusy(true);
    const { error } = await sendPasswordReset(email);
    setBusy(false);
    // Never reveal whether the email exists.
    if (error && error.toLowerCase().includes('not configured')) return setError(error);
    setSent(true);
  }

  return (
    <div className="center-screen">
      <Card className="auth-card">
        <div className="center" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 21 }}>Reset password</h2>
        </div>
        <ConfigNotice />
        {error && <Alert tone="error">{error}</Alert>}
        {sent ? (
          <Alert tone="success">If an account exists with this email, a password reset link has been sent.</Alert>
        ) : (
          <form onSubmit={submit}>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Button type="submit" block loading={busy}>
              Send reset link
            </Button>
          </form>
        )}
        <p className="center tiny" style={{ marginTop: 16 }}>
          <Link to="/login">Back to login</Link>
        </p>
      </Card>
    </div>
  );
}
