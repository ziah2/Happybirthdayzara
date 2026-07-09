import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Badge, Card, EmptyState, Skeleton } from '../components/ui';
import { timeAgo } from '../lib/utils';
import type { NewsPost, Note } from '../lib/database.types';

const QUICK_LINKS = [
  { to: '/notes', icon: '📚', label: 'Study Materials' },
  { to: '/chat', icon: '💬', label: 'Dept. Chat' },
  { to: '/news', icon: '📰', label: 'Campus News' },
  { to: '/search', icon: '🔎', label: 'Search' },
  { to: '/apply', icon: '⭐', label: 'Be a Contributor' },
  { to: '/roadmap', icon: '🚀', label: "What's Next" },
];

export function Dashboard() {
  const { profile, faculties, departments } = useAuth();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsPost[] | null>(null);
  const [files, setFiles] = useState<Note[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setNews([]);
      setFiles([]);
      return;
    }
    (async () => {
      const [{ data: n }, { data: f }] = await Promise.all([
        supabase.from('news').select('*').order('created_at', { ascending: false }).limit(6),
        supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(6),
      ]);
      setNews((n as NewsPost[] | null) ?? []);
      setFiles((f as Note[] | null) ?? []);
    })();
  }, []);

  const facultyName = faculties.find((f) => f.id === profile?.faculty_id)?.name;
  const deptName = departments.find((d) => d.id === profile?.department_id)?.name;

  return (
    <div className="page stack">
      <Card className="card-3d" style={{ padding: 20, borderTop: '4px solid var(--accent)' }}>
        <div className="tiny muted">Welcome back</div>
        <h2 style={{ fontSize: 24, margin: '2px 0 8px' }}>Hello, {profile?.full_name || 'Student'} 👋</h2>
        <div className="row wrap" style={{ gap: 8 }}>
          {facultyName && <Badge tone="primary">{facultyName}</Badge>}
          {deptName && <Badge>{deptName}</Badge>}
          {profile?.level && <Badge tone="muted">{profile.level} Level</Badge>}
        </div>
      </Card>

      <div>
        <div className="section-label">Quick Links</div>
        <div className="grid-3">
          {QUICK_LINKS.map((q) => (
            <Card key={q.to} interactive onClick={() => navigate(q.to)} style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 26 }}>{q.icon}</div>
              <div className="tiny" style={{ marginTop: 6, fontWeight: 600 }}>
                {q.label}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="section-divider" />

      <div>
        <div className="section-label">Latest News</div>
        {!news ? (
          <Skeleton height={90} />
        ) : news.length === 0 ? (
          <EmptyState emoji="📰" text="No news yet." />
        ) : (
          <div className="hscroll">
            {news.map((p) => (
              <Card key={p.id} interactive onClick={() => navigate('/news')} style={{ padding: 16, width: 230 }}>
                <Badge>{p.category}</Badge>
                <div style={{ fontWeight: 700, margin: '8px 0 4px' }}>{p.title}</div>
                <div className="tiny muted">{timeAgo(p.created_at)}</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="section-label">Recent Files</div>
        {!files ? (
          <Skeleton height={70} />
        ) : files.length === 0 ? (
          <EmptyState emoji="🗂️" text="No files uploaded yet." />
        ) : (
          <div className="hscroll">
            {files.map((f) => (
              <Card key={f.id} interactive onClick={() => navigate('/notes')} style={{ padding: 16, width: 200 }}>
                <div className="icon-badge sm">📄</div>
                <div style={{ fontWeight: 700, marginTop: 8 }}>{f.title}</div>
                <div className="tiny muted">{f.downloads} downloads</div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="section-label">Trending Discussions</div>
        <Card style={{ padding: 16 }}>
          <div className="row">
            <div className="icon-badge sm accent">🔥</div>
            <div>
              <div style={{ fontWeight: 700 }}>Join your department chat</div>
              <div className="tiny muted">Real-time discussions with your classmates</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
