import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { pullSyncData } from '../services/sync';
import { store } from '../services/db';
import { setupRealtimeSubscription, cleanupRealtimeSubscription } from '../services/realtime';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still loading
  const [session, setSession] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      return;
    }

    // Get the current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData();
        setupRealtimeSubscription(session.user.id);
      }
    });

    // Subscribe to future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserData();
          setupRealtimeSubscription(session.user.id);
        }

        if (event === 'SIGNED_OUT') {
          // Clear local state so a different user doesn't see stale data
          localStorage.removeItem('system_app_state');
          store.setState({ _reset: true }, true);
          cleanupRealtimeSubscription();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserData() {
    setLoadingData(true);
    try {
      const cloudState = await pullSyncData();
      if (cloudState) {
        store.setState(cloudState, true);
      }
    } catch (err) {
      console.warn('Could not pull cloud data on sign-in:', err.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, loadingData, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
