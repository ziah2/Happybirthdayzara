import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, Select, Textarea, Toggle } from '../../components/ui';
import { formatDate } from '../../lib/utils';
import type { ContributorRequest, Profile } from '../../lib/database.types';

type Section = 'requests' | 'analytics' | 'faculties' | 'users' | 'announce';

interface RequestView extends ContributorRequest {
  facultyName: string;
  departmentName: string;
}

export function AdminPanel() {
  const { faculties, departments } = useAuth();
  const [section, setSection] = useState<Section>('requests');

  return (
    <div className="page stack">
      <h2 style={{ fontSize: 22 }}>Admin Panel</h2>
      <div className="chip-row">
        {(
          [
            ['requests', 'Requests'],
            ['analytics', 'Analytics'],
            ['faculties', 'Faculties'],
            ['users', 'Users'],
            ['announce', 'Announce'],
          ] as [Section, string][]
        ).map(([k, label]) => (
          <button key={k} className={`chip${section === k ? ' active' : ''}`} onClick={() => setSection(k)}>
            {label}
          </button>
        ))}
      </div>

      {section === 'requests' && <Requests faculties={faculties} departments={departments} />}
      {section === 'analytics' && <Analytics />}
      {section === 'faculties' && <Faculties />}
      {section === 'users' && <Users />}
      {section === 'announce' && <Announce />}
    </div>
  );
}

async function bestEffortEmail(payload: Record<string, unknown>) {
  // Sends transactional email via the optional `notify-email` edge function
  // (Resend). Silently ignored if the function isn't deployed yet.
  try {
    await supabase.functions.invoke('notify-email', { body: payload });
  } catch {
    /* noop */
  }
}

function Requests({
  faculties,
  departments,
}: {
  faculties: { id: string; name: string }[];
  departments: { id: string; name: string }[];
}) {
  const [rows, setRows] = useState<RequestView[] | null>(null);
  const [detail, setDetail] = useState<RequestView | null>(null);
  const [rejecting, setRejecting] = useState<RequestView | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return setRows([]);
    const { data } = await supabase.from('contributor_requests').select('*').order('submitted_at', { ascending: false });
    const list = (data as ContributorRequest[] | null) ?? [];
    setRows(
      list.map((r) => ({
        ...r,
        facultyName: faculties.find((f) => f.id === r.faculty_id)?.name ?? '—',
        departmentName: departments.find((d) => d.id === r.department_id)?.name ?? '—',
      })),
    );
  }, [faculties, departments]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve(r: RequestView) {
    await supabase.from('users').update({ role: 'contributor' }).eq('id', r.user_id);
    await supabase.from('contributor_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', r.id);
    await supabase.from('notifications').insert({
      user_id: r.user_id,
      type: 'contributor',
      body: 'Your contributor request has been approved. Welcome to the Contributor Team!',
    });
    await bestEffortEmail({ kind: 'contributor_approved', to: r.user_id });
    load();
  }

  async function reject() {
    if (!rejecting) return;
    await supabase
      .from('contributor_requests')
      .update({ status: 'rejected', rejection_reason: reason || null, reviewed_at: new Date().toISOString() })
      .eq('id', rejecting.id);
    await supabase.from('notifications').insert({
      user_id: rejecting.user_id,
      type: 'contributor',
      body: `Your contributor application was not approved.${reason ? ' Reason: ' + reason : ''} You may apply again after 30 days.`,
    });
    await bestEffortEmail({ kind: 'contributor_rejected', to: rejecting.user_id, reason });
    setRejecting(null);
    setReason('');
    load();
  }

  if (rows === null) return <Card style={{ padding: 16 }}>Loading…</Card>;
  if (rows.length === 0) return <EmptyState emoji="📥" text="No contributor requests." />;

  return (
    <div className="stack">
      {rows.map((r) => (
        <Card key={r.id} style={{ padding: 16 }}>
          <div className="between">
            <div>
              <div style={{ fontWeight: 700 }}>{r.full_name}</div>
              <div className="tiny muted mono">{r.matric_number}</div>
            </div>
            <Badge tone={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'muted'}>{r.status}</Badge>
          </div>
          <div className="tiny muted" style={{ margin: '8px 0' }}>
            {r.facultyName} · {r.departmentName} · {r.level}L · {formatDate(r.submitted_at)}
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <Button size="sm" variant="ghost" onClick={() => setDetail(r)}>View Details</Button>
            {r.status === 'pending' && (
              <>
                <Button size="sm" variant="success" onClick={() => approve(r)}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => setRejecting(r)}>Reject</Button>
              </>
            )}
          </div>
        </Card>
      ))}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Application details">
        {detail && (
          <div className="stack">
            <Info label="Name" value={detail.full_name} />
            <Info label="Matric" value={detail.matric_number} />
            <Info label="Faculty" value={detail.facultyName} />
            <Info label="Department" value={detail.departmentName} />
            <Info label="Level" value={`${detail.level} Level`} />
            <Info label="Reason" value={detail.reason} />
            <Info label="Will upload" value={detail.upload_types} />
            {detail.portfolio_url && <a href={detail.portfolio_url} target="_blank" rel="noreferrer">Portfolio link ↗</a>}
            {detail.id_card_url && <a href={detail.id_card_url} target="_blank" rel="noreferrer">View ID card ↗</a>}
          </div>
        )}
      </Modal>

      <Modal open={!!rejecting} onClose={() => setRejecting(null)} title="Reject application">
        <Field label="Reason (optional)">
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Button block variant="danger" onClick={reject}>Confirm rejection</Button>
      </Modal>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="tiny muted">{label}</div>
      <div style={{ fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Analytics() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return setStats({});
    (async () => {
      const count = async (table: string, filter?: [string, string]) => {
        let q = supabase.from(table).select('id', { count: 'exact', head: true });
        if (filter) q = q.eq(filter[0], filter[1]);
        const { count: c } = await q;
        return c ?? 0;
      };
      setStats({
        users: await count('users'),
        contributors: await count('users', ['role', 'contributor']),
        uploads: await count('notes'),
        downloads: await count('downloads'),
        pending: await count('contributor_requests', ['status', 'pending']),
        approved: await count('contributor_requests', ['status', 'approved']),
      });
    })();
  }, []);

  if (!stats) return <Card style={{ padding: 16 }}>Loading…</Card>;
  const tiles: [string, number][] = [
    ['Users', stats.users],
    ['Contributors', stats.contributors],
    ['Uploads', stats.uploads],
    ['Downloads', stats.downloads],
    ['Pending apps', stats.pending],
    ['Approved apps', stats.approved],
  ];
  return (
    <div className="grid-2">
      {tiles.map(([label, num]) => (
        <Card key={label} className="stat-tile">
          <div className="num">{num}</div>
          <div className="lbl">{label}</div>
        </Card>
      ))}
    </div>
  );
}

function Faculties() {
  const { faculties, departments } = useAuth();
  const [abbr, setAbbr] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    if (!abbr.trim() || !name.trim()) return;
    const { error } = await supabase.from('faculties').insert({ abbreviation: abbr.trim(), name: name.trim() });
    setMsg(error ? error.message : 'Faculty added. Refresh to see it in dropdowns.');
    setAbbr('');
    setName('');
  }

  return (
    <div className="stack">
      <Card style={{ padding: 16 }}>
        <div className="section-label">Add Faculty</div>
        {msg && <Alert tone="info">{msg}</Alert>}
        <Field label="Abbreviation"><Input value={abbr} onChange={(e) => setAbbr(e.target.value)} /></Field>
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Button size="sm" onClick={add}>Add faculty</Button>
      </Card>
      <div className="section-label">Existing ({faculties.length} faculties, {departments.length} departments)</div>
      {faculties.map((f) => (
        <Card key={f.id} style={{ padding: 14 }}>
          <div className="row"><Badge tone="primary">{f.abbreviation}</Badge><span style={{ fontWeight: 700 }}>{f.name}</span></div>
          <div className="tiny muted" style={{ marginTop: 6 }}>
            {departments.filter((d) => d.faculty_id === f.id).length} departments
          </div>
        </Card>
      ))}
    </div>
  );
}

function Users() {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    let query = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50);
    if (q.trim()) query = query.ilike('full_name', `%${q}%`);
    const { data } = await query;
    setUsers((data as Profile[] | null) ?? []);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleBan(u: Profile) {
    await supabase.from('users').update({ banned: !u.banned }).eq('id', u.id);
    load();
  }
  async function setRole(u: Profile, role: string) {
    await supabase.from('users').update({ role }).eq('id', u.id);
    load();
  }

  return (
    <div className="stack">
      <Input placeholder="🔎 Search users…" value={q} onChange={(e) => setQ(e.target.value)} />
      {users.map((u) => (
        <Card key={u.id} style={{ padding: 14 }}>
          <div className="between">
            <div>
              <div style={{ fontWeight: 700 }}>{u.full_name || u.email}</div>
              <div className="tiny muted">{u.email}</div>
            </div>
            <Badge tone={u.banned ? 'danger' : u.role === 'admin' ? 'danger' : u.role === 'contributor' ? 'success' : 'muted'}>
              {u.banned ? 'banned' : u.role}
            </Badge>
          </div>
          <div className="between" style={{ marginTop: 10 }}>
            <Select value={u.role} onChange={(e) => setRole(u, e.target.value)} style={{ maxWidth: 180 }}>
              <option value="student">student</option>
              <option value="contributor">contributor</option>
              <option value="admin">admin</option>
            </Select>
            <div className="row">
              <span className="tiny muted">{u.banned ? 'Banned' : 'Active'}</span>
              <Toggle active={u.banned} onChange={() => toggleBan(u)} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Announce() {
  const [body, setBody] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!body.trim()) return;
    setBusy(true);
    const { data: users } = await supabase.from('users').select('id');
    const rows = (users ?? []).map((u: { id: string }) => ({ user_id: u.id, type: 'announcement', body }));
    if (rows.length) await supabase.from('notifications').insert(rows);
    setBusy(false);
    setMsg(`Announcement sent to ${rows.length} users.`);
    setBody('');
  }

  return (
    <Card style={{ padding: 16 }}>
      <div className="section-label">Platform announcement</div>
      {msg && <Alert tone="success">{msg}</Alert>}
      <Field><Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message to all users…" style={{ minHeight: 120 }} /></Field>
      <Button block loading={busy} onClick={send}>Send announcement</Button>
    </Card>
  );
}
