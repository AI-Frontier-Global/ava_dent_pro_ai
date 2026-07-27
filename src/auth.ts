import { useEffect, useState, useCallback } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

export function getRedirectTo(): string {
  const envUrl = import.meta.env.VITE_APP_URL as string | undefined;
  if (envUrl && envUrl.startsWith('http')) return envUrl.replace(/\/$/, '');
  // في بيئة التطوير: Vite يعمل على 5173 افتراضياً — تجنب إعادة التوجيه لمنفذ خاطئ
  if (typeof window !== 'undefined' && window.location?.origin) {
    const origin = window.location.origin;
    // إذا كان المنفذ 3000، فهذا يعني أن VITE_APP_URL غير مضبوط — نعود للقيمة الآمنة
    if (origin.includes(':3000')) return 'https://ava-dent-pro-ai.vercel.app';
    return origin;
  }
  return 'https://ava-dent-pro-ai.vercel.app';
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setReady(true);
      }
    }).catch(() => {
      if (mounted) {
        setSession(null);
        setReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (mounted) {
        setSession(sess);
        if (!ready) setReady(true);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: getRedirectTo() } });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: getRedirectTo() },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return { session, ready, signIn, signUp, signInWithGoogle, signOut };
}
