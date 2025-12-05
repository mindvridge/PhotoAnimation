'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isAuthenticated: false,
  });

  const supabase = createClient();

  const refreshAuth = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session?.user,
      });
    } catch {
      setState({
        user: null,
        session: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  }, [supabase.auth]);

  useEffect(() => {
    // Initial auth state
    refreshAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        isAuthenticated: !!session?.user,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, refreshAuth]);

  return {
    ...state,
    refreshAuth,
  };
}

export default useAuth;
