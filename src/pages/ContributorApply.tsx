import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, STORAGE_BUCKETS, supabase } from '../lib/supabase';
import { Alert, Button, Card, Field, Input, Select, Textarea } from '../components/ui';
import { LEVELS } from '../lib/faculties';

export function ContributorApply() {
  const { user, profile, faculties, departments, isVerified } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [matric, setMatric] = useState(profile?.matric_number ?? '');
  const [facultyId, setFacultyId] = useState(profile?.faculty_id ?? '');
  const [departmentId, setDepartmentId] = useState(profile?.department_id ?? '');
  const [level, setLevel] = useState(profile?.level ? String(profile.level) : '');
  const [reason, setReason] = useState('');
  const [uploadTypes, setUploadTypes] = useState('');
  const [idCard, setIdCard] = useState<File | null>(null);
  const [portfolio, setPortfolio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const deptOpts = useMemo(() => departments.filter((d) => d.faculty_id === facultyId), [departments, facultyId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isVerified) return setError('Please verify your email before applying.');
    if (!fullName || !matric || !facultyId || !departmentId || !level) return setError('Fill in all required fields.');
    if (!reason.trim() || !uploadTypes.trim()) return setError('Tell us why and what you will upload.');
    if (!idCard) return setError('Please upload your Student ID card.');
    if (!isSupabaseConfigured || !user) return setError('Supabase is not configured.');

    setBusy(true);
    try {
      const path = `${user.id}/${Date.now()}-${idCard.name}`;
      const up = await supabase.storage.from(STORAGE_BUCKETS.idCards).upload(path, idCard);
      if (up.error) throw up.error;
      const { data: pub } = supabase.storage.from(STORAGE_BUCKETS.idCards).getPublicUrl(path);
      const { error: insErr } = await supabase.from('contributor_requests').insert({
        user_id: user.id,
        full_name: fullName,
        matric_number: matric,
        faculty_id: facultyId,
        department_id: departmentId,
        level: Number(level),
        reason,
        upload_types: uploadTypes,
        id_card_url: pub.publicUrl,
        portfolio_url: portfolio || null,
        status: 'pending',
      });
      if (insErr) throw insErr;
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="page">
        <Card className="center" style={{ padding: 24 }}>
          <div style={{ fontSize: 44 }}>🎉</div>
          <h2 style={{ fontSize: 20, margin: '10px 0' }}>Application submitted</h2>
          <p className="muted">
            Your application has been submitted successfully. It will be reviewed by an administrator. You will receive an
            email once a decision has been made.
          </p>
          <Button style={{ marginTop: 16 }} onClick={() => navigate('/profile')}>
            Back to profile
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page stack">
      <h2 style={{ fontSize: 22 }}>Become a Contributor</h2>
      <Card style={{ padding: 18 }}>
        {error && <Alert tone="error">{error}</Alert>}
        <form onSubmit={submit}>
          <Field label="Full Name">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Matric Number">
            <Input className="mono" value={matric} onChange={(e) => setMatric(e.target.value)} />
          </Field>
          <Field label="Faculty">
            <Select value={facultyId} onChange={(e) => { setFacultyId(e.target.value); setDepartmentId(''); }}>
              <option value="">Select</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={!facultyId}>
              <option value="">Select</option>
              {deptOpts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Level">
            <Select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">Select</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l} Level</option>
              ))}
            </Select>
          </Field>
          <Field label="Why do you want to become a contributor?">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <Field label="What type of materials will you upload?">
            <Textarea value={uploadTypes} onChange={(e) => setUploadTypes(e.target.value)} />
          </Field>
          <Field label="Student ID Card (required)">
            <div className="upload-well" onClick={() => fileRef.current?.click()}>
              {idCard ? `📎 ${idCard.name}` : '📤 Tap to upload your ID card (image or PDF)'}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              hidden
              onChange={(e) => setIdCard(e.target.files?.[0] ?? null)}
            />
          </Field>
          <Field label="Portfolio or Google Drive link (optional)">
            <Input value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://…" />
          </Field>
          <Button type="submit" block loading={busy}>
            Submit application
          </Button>
        </form>
      </Card>
    </div>
  );
}
