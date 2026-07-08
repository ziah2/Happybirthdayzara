import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { isSupabaseConfigured, STORAGE_BUCKETS, supabase } from '../lib/supabase';
import { Alert, Card, EmptyState, Input } from '../components/ui';
import { initials } from '../lib/utils';
import type { Message } from '../lib/database.types';

interface MsgView extends Message {
  senderName: string;
}

const EMOJIS = ['😀', '😂', '🙌', '🔥', '👍', '❤️', '🎉', '😭', '🙏', '💯', '📚', '✅'];

export function Chat() {
  const { user, profile, isVerified, departments } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MsgView[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [replyTo, setReplyTo] = useState<MsgView | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const deptName = departments.find((d) => d.id === profile?.department_id)?.name;

  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.department_id) {
      setLoading(false);
      return;
    }
    (async () => {
      const { data: chat } = await supabase
        .from('chats')
        .select('id')
        .eq('department_id', profile.department_id)
        .maybeSingle();
      if (!chat) {
        setLoading(false);
        return;
      }
      setChatId(chat.id);
      const { data } = await supabase
        .from('messages')
        .select('*, users(full_name)')
        .eq('chat_id', chat.id)
        .order('created_at')
        .limit(200);
      const rows = (data as (Message & { users: { full_name: string } | null })[] | null) ?? [];
      setMessages(rows.map((r) => ({ ...r, senderName: r.users?.full_name ?? 'Student' })));
      setLoading(false);

      const channel = supabase
        .channel(`chat:${chat.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` }, async (payload) => {
          const m = payload.new as Message;
          const { data: u } = await supabase.from('users').select('full_name').eq('id', m.sender_id).maybeSingle();
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, { ...m, senderName: u?.full_name ?? 'Student' }]));
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    })();
  }, [profile?.department_id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!chatId || !user || !text.trim()) return;
    const body = text.trim();
    setText('');
    const replyId = replyTo?.id ?? null;
    setReplyTo(null);
    await supabase.from('messages').insert({ chat_id: chatId, sender_id: user.id, body, reply_to_id: replyId });
  }

  async function attachImage(file: File) {
    if (!chatId || !user) return;
    const path = `${chatId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKETS.chat).upload(path, file);
    if (error) return;
    const { data } = supabase.storage.from(STORAGE_BUCKETS.chat).getPublicUrl(path);
    await supabase.from('messages').insert({ chat_id: chatId, sender_id: user.id, image_url: data.publicUrl });
  }

  if (!isVerified) {
    return (
      <div className="page">
        <EmptyState emoji="🔒" text="Verify your email to join your department chat." />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page">
        <div className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(37,99,235,0.25)', margin: '40px auto' }} />
      </div>
    );
  }

  if (!chatId) {
    return (
      <div className="page">
        <EmptyState emoji="💬" text="No chat room found for your department yet." />
      </div>
    );
  }

  const shown = search.trim() ? messages.filter((m) => (m.body ?? '').toLowerCase().includes(search.toLowerCase())) : messages;

  return (
    <div className="page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--topbar-height) - var(--nav-height) - 20px)' }}>
      <div className="between" style={{ marginBottom: 8 }}>
        <div>
          <h2 style={{ fontSize: 19 }}>{deptName ?? 'Department'} Chat</h2>
          <div className="tiny muted">{messages.length} messages</div>
        </div>
      </div>
      <Input placeholder="🔎 Search messages…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 10 }} />

      <div className="stack" style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {shown.length === 0 && <EmptyState emoji="👋" text="No messages yet. Say hi!" />}
        {shown.map((m) => {
          const mine = m.sender_id === user?.id;
          const parent = m.reply_to_id ? messages.find((x) => x.id === m.reply_to_id) : null;
          return (
            <div key={m.id} className={`bubble ${mine ? 'sent' : 'received'}`} onDoubleClick={() => setReplyTo(m)}>
              {!mine && <div className="tiny" style={{ fontWeight: 700, opacity: 0.8 }}>{initials(m.senderName)} · {m.senderName}</div>}
              {parent && (
                <div className="tiny" style={{ opacity: 0.7, borderLeft: '2px solid currentColor', paddingLeft: 6, margin: '4px 0' }}>
                  {parent.body ?? '📷 image'}
                </div>
              )}
              {m.image_url && <img src={m.image_url} alt="attachment" style={{ maxWidth: '100%', borderRadius: 10, marginTop: 4 }} />}
              {m.body && <div>{m.body}</div>}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {replyTo && (
        <Alert tone="info">
          Replying to: {replyTo.body ?? 'image'} <button className="btn btn-ghost btn-sm" onClick={() => setReplyTo(null)}>✕</button>
        </Alert>
      )}

      {showEmoji && (
        <Card style={{ padding: 10, marginBottom: 8 }}>
          <div className="row wrap" style={{ gap: 6 }}>
            {EMOJIS.map((e) => (
              <button key={e} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setText((t) => t + e); setShowEmoji(false); }}>
                {e}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => setShowEmoji((s) => !s)} aria-label="Emoji">😊</button>
        <button className="btn btn-ghost btn-icon" onClick={() => fileRef.current?.click()} aria-label="Attach">📎</button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && attachImage(e.target.files[0])} />
        <Input
          placeholder="Message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn btn-primary-3d btn-icon" onClick={send} aria-label="Send">➤</button>
      </div>
    </div>
  );
}
