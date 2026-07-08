import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Alert, Button, Card, Field, Input, Select } from '../../components/ui';
import { ConfigNotice } from '../../components/layout/ConfigNotice';
import { FACULTIES, LEVELS } from '../../lib/faculties';
import { isValidEmail, passwordIssue } from '../../lib/utils';

interface Opt {
  id: string;
  name: string;
}

export function Signup() {
  const { signUp, faculties, departments } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matric, setMatric] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  // Use live DB reference data when available; otherwise fall back to the static
  // hierarchy so the dropdowns are demonstrable in demo mode.
  const usingDb = faculties.length > 0;
  const facultyOpts: Opt[] = useMemo(
    () => (usingDb ? faculties.map((f) => ({ id: f.id, name: f.name })) : FACULTIES.map((f) => ({ id: f.abbreviation, name: f.name }))),
    [usingDb, faculties],
  );
  const deptOpts: Opt[] = useMemo(() => {
    if (!facultyId) return [];
    if (usingDb) return departments.filter((d) => d.faculty_id === facultyId).map((d) => ({ id: d.id, name: d.name }));
    const fac = FACULTIES.find((f) => f.abbreviation === facultyId);
    return (fac?.departments ?? []).map((n) => ({ id: `${facultyId}::${n}`, name: n }));
  }, [facultyId, usingDb, departments]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError('Full name is required.');
    if (!isValidEmail(email)) return setError('Enter a valid email address.');
    const pwIssue = passwordIssue(password);
    if (pwIssue) return setError(pwIssue);
    if (!matric.trim()) return setError('Matric number is required.');
    if (!facultyId || !departmentId || !level) return setError('Select your faculty, department and level.');

    setBusy(true);
    const { error } = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      matricNumber: matric.trim(),
      facultyId,
      departmentId,
      level: Number(level),
    });
    setBusy(false);
    if (error) return setError(error);
    setDone(true);
  }

  if (done) {
    return (
      <div className="center-screen">
        <Card className="auth-card center">
          <div className="splash-logo" style={{ width: 64, height: 64, fontSize: 30, margin: '0 auto 16px' }}>
            📬
          </div>
          <h2 style={{ fontSize: 21 }}>Account created</h2>
          <p className="muted" style={{ margin: '12px 0 20px' }}>
            Your account has been created. Please verify your email before using the app.
          </p>
          <Button block onClick={() => navigate('/verify-email')}>
            Go to verification
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="center-screen">
      <Card className="auth-card">
        <div className="center" style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22 }}>Create your account</h2>
          <p className="muted tiny">All registrations create a student account</p>
        </div>
        <ConfigNotice />
        {error && <Alert tone="error">{error}</Alert>}
        <form onSubmit={submit}>
          <Field label="Full Name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 chars, mixed case + number" />
          </Field>
          <Field label="Matric Number">
            <Input className="mono" value={matric} onChange={(e) => setMatric(e.target.value)} placeholder="CSC/2021/001" />
          </Field>
          <Field label="Faculty">
            <Select
              value={facultyId}
              onChange={(e) => {
                setFacultyId(e.target.value);
                setDepartmentId('');
              }}
            >
              <option value="">Select faculty</option>
              {facultyOpts.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!facultyId}>
              <option value="">{facultyId ? 'Select department' : 'Select faculty first'}</option>
              {deptOpts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Level">
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Select level</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l} Level
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" block loading={busy}>
            Create Account
          </Button>
        </form>
        <p className="center tiny" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </Card>
    </div>
  );
}
