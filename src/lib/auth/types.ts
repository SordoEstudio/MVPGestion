import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type { SupabaseUser as AuthUser, Session };

export type UserRole = 'store_user' | 'accountant';

export interface UserProfile {
  user_id: string;
  role: UserRole;
  store_id: string | null;
  accountant_id: string | null;
}

export interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}
