import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Whether the app has been configured with real Supabase credentials.
 * When false the UI renders normally but shows a config notice instead of
 * attempting network calls, so the app is runnable before keys are added.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

// A single shared client. When unconfigured we still create a client pointed at
// harmless placeholder values so imports don't throw; guards elsewhere prevent
// real calls from firing.
export const supabase: SupabaseClient = createClient(
  url ?? 'https://placeholder.supabase.co',
  anonKey ?? 'public-anon-placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const STORAGE_BUCKETS = {
  notes: 'notes',
  chat: 'chat-images',
  idCards: 'id-cards',
} as const;
