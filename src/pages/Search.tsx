import { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Badge, Card, EmptyState, Input } from '../components/ui';

interface Results {
  courses: { id: string; course_code: string; course_title: string }[];
  notes: { id: string; title: string }[];
  contributors: { id: string; full_name: string; role: string }[];
  departments: { id: string; name: string }[];
  news: { id: string; title: string; category: string }[];
}

export function Search() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Results | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(term: string) {
    setQ(term);
    if (!isSupabaseConfigured || term.trim().length < 2) {
      setRes(null);
      return;
    }
    setBusy(true);
    const like = `%${term}%`;
    const [courses, notes, contributors, departments, news] = await Promise.all([
      supabase.from('courses').select('id, course_code, course_title').or(`course_code.ilike.${like},course_title.ilike.${like}`).limit(10),
      supabase.from('notes').select('id, title').ilike('title', like).limit(10),
      supabase.from('users').select('id, full_name, role').ilike('full_name', like).in('role', ['contributor', 'admin']).limit(10),
      supabase.from('departments').select('id, name').ilike('name', like).limit(10),
      supabase.from('news').select('id, title, category').ilike('title', like).limit(10),
    ]);
    setBusy(false);
    setRes({
      courses: courses.data ?? [],
      notes: notes.data ?? [],
      contributors: contributors.data ?? [],
      departments: departments.data ?? [],
      news: news.data ?? [],
    });
  }

  const total = res ? Object.values(res).reduce((a, b) => a + b.length, 0) : 0;

  return (
    <div className="page stack">
      <h2 style={{ fontSize: 22 }}>Search</h2>
      <Input autoFocus placeholder="🔎 Courses, notes, people, news…" value={q} onChange={(e) => run(e.target.value)} />

      {q.trim().length < 2 ? (
        <EmptyState emoji="🔎" text="Type at least 2 characters to search everything." />
      ) : busy ? (
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(37,99,235,0.25)', margin: '20px auto' }} />
      ) : total === 0 ? (
        <EmptyState emoji="🤷" text="No results found." />
      ) : (
        <>
          {res && (res.courses.length > 0 || res.departments.length > 0) && (
            <Card style={{ padding: 16 }}>
              <div className="section-label">Courses & Departments</div>
              <div className="stack">
                {res.courses.map((c) => (
                  <div key={c.id} className="row">
                    <Badge tone="primary">{c.course_code}</Badge>
                    <span style={{ fontWeight: 600 }}>{c.course_title}</span>
                  </div>
                ))}
                {res.departments.map((d) => (
                  <div key={d.id} className="row">
                    <span>🏫</span>
                    <span style={{ fontWeight: 600 }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {res && res.notes.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div className="section-label">Notes & Files</div>
              <div className="stack">
                {res.notes.map((n) => (
                  <div key={n.id} className="row">
                    <span>📄</span>
                    <span style={{ fontWeight: 600 }}>{n.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {res && res.contributors.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div className="section-label">People</div>
              <div className="stack">
                {res.contributors.map((u) => (
                  <div key={u.id} className="between">
                    <span style={{ fontWeight: 600 }}>{u.full_name}</span>
                    <Badge tone={u.role === 'admin' ? 'danger' : 'success'}>{u.role}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
          {res && res.news.length > 0 && (
            <Card style={{ padding: 16 }}>
              <div className="section-label">News</div>
              <div className="stack">
                {res.news.map((n) => (
                  <div key={n.id} className="row">
                    <Badge>{n.category}</Badge>
                    <span style={{ fontWeight: 600 }}>{n.title}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
