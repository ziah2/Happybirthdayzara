import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import type { Department, Faculty, Profile } from '../lib/database.types';
import { AuthContext, type SignUpInput } from './authContext';

const NOT_CONFIGURED = 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', uid).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  const reloadProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  // Reference data (faculties + departments) for dropdowns everywhere.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    (async () => {
      const [{ data: fac }, { data: dep }] = await Promise.all([
        supabase.from('faculties').select('*').order('name'),
        supabase.from('departments').select('*').order('name'),
      ]);
      setFaculties((fac as Faculty[] | null) ?? []);
      setDepartments((dep as Department[] | null) ?? []);
    })();
  }, []);

  // Auth session bootstrap + subscription.
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (input: SignUpInput) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
        // Consumed by the handle_new_user() DB trigger to build the profile row.
        data: {
          full_name: input.fullName,
          matric_number: input.matricNumber,
          faculty_id: input.facultyId,
          department_id: input.departmentId,
          level: input.level,
        },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered')) {
        return { error: 'An account with this email already exists. Please log in or reset your password.' };
      }
      return { error: error.message };
    }
    // Supabase returns an identities array of length 0 when the email already exists.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: 'An account with this email already exists. Please log in or reset your password.' };
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    return { error: error ? error.message : null };
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? error.message : null };
  }, []);

  const resendVerification = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
    if (!user?.email) return { error: 'No email on file.' };
    const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
    return { error: error ? error.message : null };
  }, [user]);

  const checkVerification = useCallback(async () => {
    if (!isSupabaseConfigured) return { verified: false, error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return { verified: false, error: error.message };
    const confirmed = Boolean(data.user?.email_confirmed_at);
    if (confirmed && user) {
      await supabase.from('users').update({ email_verified: true }).eq('id', user.id);
      await loadProfile(user.id);
    }
    return { verified: confirmed, error: null };
  }, [user, loadProfile]);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!isSupabaseConfigured) return { error: NOT_CONFIGURED };
      if (!user) return { error: 'Not signed in.' };
      // role/banned are never writable from the client (enforced again by RLS/trigger).
      const { role: _role, banned: _banned, id: _id, ...safe } = patch;
      void _role;
      void _banned;
      void _id;
      const { error } = await supabase.from('users').update(safe).eq('id', user.id);
      if (!error) await loadProfile(user.id);
      return { error: error ? error.message : null };
    },
    [user, loadProfile],
  );

  const isVerified = Boolean(profile?.email_verified);

  return (
    <AuthContext.Provider
      value={{
        loading,
        session,
        user,
        profile,
        faculties,
        departments,
        isVerified,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        sendPasswordReset,
        resendVerification,
        checkVerification,
        updateProfile,
        reloadProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
