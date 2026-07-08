import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useNotifications } from '../../hooks/useNotifications';
import { Avatar, Modal, Toggle } from '../ui';
import { cx, timeAgo } from '../../lib/utils';

const TABS = [
  { to: '/dashboard', label: 'Home', icon: '🏠' },
  { to: '/notes', label: 'Notes', icon: '📚' },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/news', label: 'News', icon: '📰' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export function AppShell() {
  const { profile, isVerified, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { items, unread, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div className="brand">
          <span>🎓</span>
          <span>Student Hub</span>
        </div>
        <div className="row" style={{ gap: 14 }}>
          <div className="row" style={{ gap: 8 }}>
            <span style={{ fontSize: 15 }}>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <Toggle active={theme === 'dark'} onChange={toggleTheme} />
          </div>
          <button
            className="btn-icon"
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
            onClick={() => {
              setNotifOpen(true);
              markAllRead();
            }}
            aria-label="Notifications"
          >
            🔔
            {unread > 0 && (
              <span className="badge-dot" style={{ position: 'absolute', top: 2, right: 2 }}>
                {unread}
              </span>
            )}
          </button>
          <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
            <Avatar name={profile?.full_name} size={38} />
          </div>
        </div>
      </div>

      {!isVerified && (
        <div className="verify-banner">
          <span>⚠️ Please verify your email to unlock all features.</span>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/verify-email')}>
            Verify Now
          </button>
        </div>
      )}

      <Outlet />

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <NavLink key={t.to} to={t.to} className={({ isActive }) => cx('nav-item', isActive && 'active')}>
            <span className="nav-icon">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>

      <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications">
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="emoji">🔕</span>
            No notifications yet.
          </div>
        ) : (
          <div className="stack">
            {items.map((n) => (
              <div key={n.id} className="card-3d" style={{ padding: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{n.body}</div>
                <div className="tiny muted" style={{ marginTop: 4 }}>
                  {timeAgo(n.created_at)}
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-ghost btn-block" onClick={() => signOut()}>
            Log out
          </button>
        </div>
      </Modal>
    </div>
  );
}
