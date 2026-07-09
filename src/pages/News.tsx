import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Alert, Badge, Button, Card, EmptyState, Field, Input, Modal, Skeleton, Textarea } from '../components/ui';
import { NEWS_CATEGORIES } from '../lib/faculties';
import { timeAgo } from '../lib/utils';
import type { NewsComment, NewsPost } from '../lib/database.types';

interface PostView extends NewsPost {
  authorName: string;
  commentCount: number;
}

export function News() {
  const { user, isVerified } = useAuth();
  const [posts, setPosts] = useState<PostView[] | null>(null);
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [openPost, setOpenPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<(NewsComment & { authorName: string })[]>([]);
  const [commentText, setCommentText] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) return setPosts([]);
    const { data } = await supabase
      .from('news')
      .select('*, users(full_name), news_comments(count)')
      .order('created_at', { ascending: false });
    const rows = (data as (NewsPost & { users: { full_name: string } | null; news_comments: { count: number }[] })[] | null) ?? [];
    setPosts(rows.map((r) => ({ ...r, authorName: r.users?.full_name ?? 'Unknown', commentCount: r.news_comments?.[0]?.count ?? 0 })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) return;
    supabase
      .from('news_likes')
      .select('news_id')
      .eq('user_id', user.id)
      .then(({ data }) => setLiked(new Set((data ?? []).map((l: { news_id: string }) => l.news_id))));
  }, [user]);

  function flash(m: string) {
    setToast(m);
    setTimeout(() => setToast(null), 2200);
  }

  async function toggleLike(p: PostView) {
    if (!isVerified || !user) return flash('Verify your email to react.');
    const has = liked.has(p.id);
    setLiked((s) => {
      const next = new Set(s);
      if (has) next.delete(p.id);
      else next.add(p.id);
      return next;
    });
    setPosts((prev) => prev?.map((x) => (x.id === p.id ? { ...x, likes: x.likes + (has ? -1 : 1) } : x)) ?? prev);
    if (has) await supabase.from('news_likes').delete().eq('user_id', user.id).eq('news_id', p.id);
    else await supabase.from('news_likes').insert({ user_id: user.id, news_id: p.id });
  }

  async function share(p: PostView) {
    const url = `${window.location.origin}/news`;
    if (navigator.share) await navigator.share({ title: p.title, text: p.title, url }).catch(() => {});
    else {
      await navigator.clipboard.writeText(`${p.title} — ${url}`);
      flash('Link copied to clipboard.');
    }
  }

  async function openComments(p: PostView) {
    setOpenPost(p);
    setComments([]);
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from('news_comments')
      .select('*, users(full_name)')
      .eq('news_id', p.id)
      .order('created_at');
    const rows = (data as (NewsComment & { users: { full_name: string } | null })[] | null) ?? [];
    setComments(rows.map((r) => ({ ...r, authorName: r.users?.full_name ?? 'Unknown' })));
  }

  async function addComment() {
    if (!openPost || !user) return;
    if (!isVerified) return flash('Verify your email to comment.');
    const { data } = await supabase
      .from('news_comments')
      .insert({ news_id: openPost.id, user_id: user.id, body: commentText })
      .select('*, users(full_name)')
      .single();
    if (data) {
      const row = data as NewsComment & { users: { full_name: string } | null };
      setComments((c) => [...c, { ...row, authorName: row.users?.full_name ?? 'You' }]);
    }
    setCommentText('');
  }

  const visible = (posts ?? []).filter(
    (p) =>
      (filter === 'All' || p.category === filter) &&
      (query.trim() === '' || (p.title + p.body).toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="page stack">
      <h2 style={{ fontSize: 22 }}>Campus News</h2>
      {toast && <Alert tone="info">{toast}</Alert>}

      <Input placeholder="🔎 Search news…" value={query} onChange={(e) => setQuery(e.target.value)} />

      <div className="chip-row">
        {['All', ...NEWS_CATEGORIES].map((c) => (
          <button key={c} className={`chip${filter === c ? ' active' : ''}`} onClick={() => setFilter(c)}>
            {c}
          </button>
        ))}
      </div>

      {posts === null ? (
        <Skeleton height={120} />
      ) : visible.length === 0 ? (
        <EmptyState emoji="📰" text="No news posts found." />
      ) : (
        visible.map((p) => (
          <Card key={p.id} style={{ padding: 16 }}>
            <Badge>{p.category}</Badge>
            <h3 style={{ fontSize: 18, margin: '10px 0 6px' }}>{p.title}</h3>
            <p className="muted" style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>
              {p.body.length > 240 ? p.body.slice(0, 240) + '…' : p.body}
            </p>
            <div className="tiny muted" style={{ margin: '10px 0' }}>
              by {p.authorName} · {timeAgo(p.created_at)}
            </div>
            <div className="row" style={{ gap: 8 }}>
              <Button size="sm" variant="ghost" onClick={() => toggleLike(p)}>
                {liked.has(p.id) ? '❤️' : '🤍'} {p.likes}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openComments(p)}>
                💬 {p.commentCount}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => share(p)}>
                ↗ Share
              </Button>
            </div>
          </Card>
        ))
      )}

      <Modal open={!!openPost} onClose={() => setOpenPost(null)} title={openPost?.title}>
        <div className="stack" style={{ marginBottom: 16 }}>
          {comments.length === 0 ? (
            <div className="muted tiny">No comments yet. Be the first!</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="card-3d" style={{ padding: 12 }}>
                <div className="tiny" style={{ fontWeight: 700 }}>{c.authorName}</div>
                <div style={{ fontSize: 14 }}>{c.body}</div>
                <div className="tiny muted">{timeAgo(c.created_at)}</div>
              </div>
            ))
          )}
        </div>
        <Field>
          <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment…" />
        </Field>
        <Button block disabled={!commentText.trim()} onClick={addComment}>
          Post comment
        </Button>
      </Modal>
    </div>
  );
}
