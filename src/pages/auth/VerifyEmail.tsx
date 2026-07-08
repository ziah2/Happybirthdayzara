import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Alert, Badge, Button, Card, Field, Input } from '../../components/ui';

export function VerifyEmail() {
  const { user, isVerified, resendVerification, checkVerification, signOut } = useAuth();
  const navigate = useNavigate();
  const [msg, setMsg] = useState<{ tone: 'info' | 'error' | 'success'; text: string } | null>(null);
  const [busy, setBusy] = useState<'resend' | 'check' | null>(null);

  async function resend() {
    setBusy('resend');
    setMsg(null);
    const { error } = await resendVerification();
    setBusy(null);
    setMsg(error ? { tone: 'error', text: error } : { tone: 'success', text: 'Verification email sent. Check your inbox.' });
  }

  async function check() {
    setBusy('check');
    setMsg(null);
    const { verified, error } = await checkVerification();
    setBusy(null);
    if (error) return setMsg({ tone: 'error', text: error });
    if (verified) {
      navigate('/dashboard', { replace: true });
    } else {
      setMsg({
        tone: 'error',
        text: 'Your email has not been verified yet. Please check your inbox and click the verification link.',
      });
    }
  }

  return (
    <div className="center-screen">
      <Card className="auth-card">
        <div className="center" style={{ marginBottom: 18 }}>
          <div className="splash-logo" style={{ width: 64, height: 64, fontSize: 30, margin: '0 auto 12px' }}>
            ✉️
          </div>
          <h2 style={{ fontSize: 21 }}>Verify your email</h2>
        </div>

        <div className="center" style={{ marginBottom: 14 }}>
          {isVerified ? <Badge tone="success">Verified</Badge> : <Badge tone="muted">Not verified</Badge>}
        </div>

        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

        <Field label="Your email">
          <Input readOnly value={user?.email ?? ''} />
        </Field>

        <div className="stack">
          <Button block onClick={check} loading={busy === 'check'}>
            I've Verified My Email
          </Button>
          <Button variant="ghost" block onClick={resend} loading={busy === 'resend'}>
            Resend Verification Email
          </Button>
          <button className="btn btn-ghost btn-block btn-sm" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </Card>
    </div>
  );
}
