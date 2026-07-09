import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useEffect,
} from 'react';
import { cx, initials } from '../../lib/utils';

/* ---------- Card ---------- */
export function Card({
  children,
  className,
  interactive,
  onClick,
  style,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cx('card-3d', interactive && 'interactive', className)}
      onClick={onClick}
      style={{ ...style, cursor: onClick ? 'pointer' : style?.cursor }}
    >
      {children}
    </div>
  );
}

/* ---------- Button ---------- */
type Variant = 'primary' | 'accent' | 'success' | 'danger' | 'ghost';
const variantClass: Record<Variant, string> = {
  primary: 'btn-primary-3d',
  accent: 'btn-accent-3d',
  success: 'btn-success-3d',
  danger: 'btn-danger-3d',
  ghost: 'btn-ghost',
};

export function Button({
  children,
  variant = 'primary',
  block,
  size,
  loading,
  className,
  ...rest
}: {
  variant?: Variant;
  block?: boolean;
  size?: 'sm';
  loading?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx('btn', variantClass[variant], block && 'btn-block', size === 'sm' && 'btn-sm', className)}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}

/* ---------- Inputs ---------- */
export function Field({
  label,
  error,
  children,
}: {
  label?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      {children}
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx('input-3d', props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx('textarea-3d', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx('select-3d', props.className)} />;
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 44 }: { name: string | null | undefined; size?: number }) {
  return (
    <div className="avatar-3d" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  );
}

/* ---------- Badge ---------- */
export function Badge({
  children,
  tone = 'accent',
}: {
  children: ReactNode;
  tone?: 'accent' | 'primary' | 'success' | 'danger' | 'muted';
}) {
  const cls =
    tone === 'primary'
      ? 'badge-primary'
      : tone === 'success'
        ? 'badge-success'
        : tone === 'danger'
          ? 'badge-danger'
          : tone === 'muted'
            ? 'badge-muted'
            : '';
  return <span className={cx('category-badge-3d', cls)}>{children}</span>;
}

/* ---------- Toggle ---------- */
export function Toggle({ active, onChange }: { active: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      className={cx('toggle-track', active && 'active')}
      onClick={onChange}
      aria-pressed={active}
      aria-label="Toggle"
    >
      <span className="toggle-thumb" />
    </button>
  );
}

/* ---------- Stars ---------- */
export function Stars({ value, onRate }: { value: number; onRate?: (n: number) => void }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= Math.round(value) ? '' : 'empty'}
          style={{ cursor: onRate ? 'pointer' : 'default' }}
          onClick={onRate ? () => onRate(n) : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}

/* ---------- Alert ---------- */
export function Alert({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'error' | 'success';
}) {
  return <div className={cx('alert', `alert-${tone}`)}>{children}</div>;
}

/* ---------- Skeleton ---------- */
export function Skeleton({ height = 64, radius = 12 }: { height?: number; radius?: number }) {
  return <div className="skeleton-3d" style={{ height, borderRadius: radius }} />;
}

/* ---------- Empty state ---------- */
export function EmptyState({ emoji = '📭', text }: { emoji?: string; text: string }) {
  return (
    <div className="empty-state">
      <span className="emoji">{emoji}</span>
      {text}
    </div>
  );
}

/* ---------- Modal / bottom sheet ---------- */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-3d" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 19 }}>{title}</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
