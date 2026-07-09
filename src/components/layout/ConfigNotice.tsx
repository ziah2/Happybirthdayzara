import { isSupabaseConfigured } from '../../lib/supabase';
import { Alert } from '../ui';

/** Shown when Supabase env vars are missing, so the demo UI is still usable. */
export function ConfigNotice() {
  if (isSupabaseConfigured) return null;
  return (
    <Alert tone="info">
      <strong>Demo mode.</strong> Supabase isn't configured yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
      <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code> to enable auth and data. See{' '}
      <code>supabase/README.md</code>.
    </Alert>
  );
}
