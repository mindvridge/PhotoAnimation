'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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

  // Only create client on the client side
  const supabase = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createClient();
  }, []);

  const refreshAuth = useCallback(async () => {
    if (!supabase) return;

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
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

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
  }, [supabase, refreshAuth]);

  return {
    ...state,
    refreshAuth,
  };
}

export default useAuth;
