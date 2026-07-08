import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Department, Faculty, Profile } from '../lib/database.types';

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
  matricNumber: string;
  facultyId: string;
  departmentId: string;
  level: number;
}

export interface AuthContextValue {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  faculties: Faculty[];
  departments: Department[];
  isVerified: boolean;
  signUp: (input: SignUpInput) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  resendVerification: () => Promise<{ error: string | null }>;
  checkVerification: () => Promise<{ verified: boolean; error: string | null }>;
  updateProfile: (patch: Partial<Profile>) => Promise<{ error: string | null }>;
  reloadProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
