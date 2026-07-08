import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { Alert, Button, Card, Field, Input } from '../../components/ui';
import { passwordIssue } from '../../lib/utils';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const issue = passwordIssue(password);
    if (issue) return setError(issue);
    if (password !== confirm) return setError('Passwords do not match.');
    if (!isSupabaseConfigured) return setError('Supabase is not configured.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => navigate('/dashboard', { replace: true }), 1200);
  }

  return (
    <div className="center-screen">
      <Card className="auth-card">
        <h2 style={{ fontSize: 21, marginBottom: 16 }} className="center">
          Set a new password
        </h2>
        {error && <Alert tone="error">{error}</Alert>}
        {done ? (
          <Alert tone="success">Password updated. Redirecting…</Alert>
        ) : (
          <form onSubmit={submit}>
            <Field label="New password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Confirm password">
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <Button type="submit" block loading={busy}>
              Update password
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
