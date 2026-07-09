import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Alert, Avatar, Badge, Button, Card, EmptyState, Field, Select } from '../components/ui';
import { LEADERSHIP_POSITIONS } from '../lib/faculties';
import type { Bookmark, ContributorRequest, Note } from '../lib/database.types';

export function Profile() {
  const { profile, faculties, departments, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState(0);
  const [saved, setSaved] = useState<(Bookmark & { note: Note | null })[]>([]);
  const [request, setRequest] = useState<ContributorRequest | null>(null);
  const [position, setPosition] = useState(profile?.position ?? '');
  const [savedMsg, setSavedMsg] = useState(false);

  const facultyName = faculties.find((f) => f.id === profile?.faculty_id)?.name;
  const deptName = departments.find((d) => d.id === profile?.department_id)?.name;

  useEffect(() => {
    if (!isSupabaseConfigured || !profile) return;
    (async () => {
      const [{ count }, { data: bm }, { data: cr }] = await Promise.all([
        supabase.from('downloads').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase.from('bookmarks').select('*, notes(*)').eq('user_id', profile.id),
        supabase
          .from('contributor_requests')
          .select('*')
          .eq('user_id', profile.id)
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setDownloads(count ?? 0);
      setSaved(((bm as (Bookmark & { notes: Note | null })[] | null) ?? []).map((b) => ({ ...b, note: b.notes })));
      setRequest((cr as ContributorRequest | null) ?? null);
    })();
  }, [profile]);

  async function savePosition() {
    await updateProfile({ position: position || null });
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  const isStudent = profile?.role === 'student';
  const hasPending = request?.status === 'pending';
  const canApply = isStudent && !hasPending && request?.status !== 'approved';

  return (
    <div className="page stack">
      <Card className="center" style={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Avatar name={profile?.full_name} size={84} />
        </div>
        <h2 style={{ fontSize: 22 }}>{profile?.full_name}</h2>
        <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
          <Badge tone={profile?.role === 'admin' ? 'danger' : profile?.role === 'contributor' ? 'success' : 'primary'}>
            {profile?.role}
          </Badge>
          {profile?.email_verified ? <Badge tone="success">Verified</Badge> : <Badge tone="muted">Unverified</Badge>}
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div className="section-label">Details</div>
        <InfoRow label="Email" value={profile?.email} />
        <InfoRow label="Matric No." value={profile?.matric_number} mono />
        <InfoRow label="Faculty" value={facultyName} />
        <InfoRow label="Department" value={deptName} />
        <InfoRow label="Level" value={profile?.level ? `${profile.level} Level` : undefined} />
      </Card>

      <div className="grid-3">
        <Card className="stat-tile">
          <div className="num">{downloads}</div>
          <div className="lbl">Downloads</div>
        </Card>
        <Card className="stat-tile">
          <div className="num">{saved.length}</div>
          <div className="lbl">Bookmarks</div>
        </Card>
        <Card className="stat-tile">
          <div className="num">{saved.length}</div>
          <div className="lbl">Saved Notes</div>
        </Card>
      </div>

      <Card style={{ padding: 16 }}>
        <div className="section-label">Leadership Position (optional)</div>
        {savedMsg && <Alert tone="success">Position updated.</Alert>}
        <Field>
          <Select value={position} onChange={(e) => setPosition(e.target.value)}>
            <option value="">None</option>
            {LEADERSHIP_POSITIONS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.roles.map((r) => (
                  <option key={`${g.group}-${r}`} value={`${g.group}: ${r}`}>
                    {r}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Button size="sm" onClick={savePosition}>Save position</Button>
      </Card>

      {(profile?.role === 'contributor' || profile?.role === 'admin') && (
        <Card style={{ padding: 16 }}>
          <div className="section-label">Dashboards</div>
          <div className="stack">
            <Button variant="ghost" block onClick={() => navigate('/contributor')}>
              📤 Contributor Dashboard
            </Button>
            {profile?.role === 'admin' && (
              <Button variant="ghost" block onClick={() => navigate('/admin')}>
                🛡️ Admin Panel
              </Button>
            )}
          </div>
        </Card>
      )}

      {isStudent && (
        <Card style={{ padding: 16 }}>
          <div className="section-label">Contributor</div>
          {hasPending ? (
            <Button variant="accent" block disabled>Application Pending</Button>
          ) : request?.status === 'approved' ? (
            <Alert tone="success">Your contributor application was approved.</Alert>
          ) : (
            <Button variant="accent" block onClick={() => navigate('/apply')} disabled={!canApply}>
              ⭐ Become a Contributor
            </Button>
          )}
          {request?.status === 'rejected' && (
            <Alert tone="error">
              Previous application was not approved.{request.rejection_reason ? ` Reason: ${request.rejection_reason}` : ''}
            </Alert>
          )}
        </Card>
      )}

      <Card style={{ padding: 16 }}>
        <div className="section-label">Saved Notes</div>
        {saved.length === 0 ? (
          <EmptyState emoji="🔖" text="No bookmarks yet." />
        ) : (
          <div className="stack">
            {saved.map((b) => (
              <div key={b.id} className="row">
                <div className="icon-badge sm">📄</div>
                <div style={{ fontWeight: 600 }}>{b.note?.title ?? 'Untitled'}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Button variant="ghost" block onClick={() => signOut()}>
        Log out
      </Button>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="between" style={{ padding: '7px 0', borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
      <span className="tiny muted">{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontWeight: 600, fontSize: 14 }}>
        {value ?? '—'}
      </span>
    </div>
  );
}
