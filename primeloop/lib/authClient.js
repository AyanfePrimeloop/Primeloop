import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from './supabaseClient';

// Reads the current logged-in user's token, if any.
export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

// Same as fetch(), but automatically attaches "Authorization: Bearer <token>"
// so the API route knows who's calling. Use this instead of plain fetch()
// for every admin/** and engager-only API call.
export async function authedFetch(url, options = {}) {
  const token = await getAccessToken();
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
}

/**
 * Put this at the top of any page that should only be visible to a logged-in
 * admin or engager. It redirects to /login if you're not signed in, or if
 * you're signed in as the wrong role.
 *
 * const { loading, me } = useRequireRole('admin');
 * if (loading) return <p>Loading...</p>;
 */
export function useRequireRole(role) {
  const router = useRouter();
  const [state, setState] = useState({ loading: true, me: null });

  useEffect(() => {
    let cancelled = false;

    async function resolve(session) {
      if (cancelled) return;
      if (!session) {
        router.replace('/login');
        return;
      }
      const res = await authedFetch('/api/auth/whoami');
      const data = await res.json();
      if (cancelled) return;
      if (!(data.roles || []).includes(role)) {
        router.replace('/login');
        return;
      }
      setState({ loading: false, me: data });
    }

    // Using onAuthStateChange instead of a one-off getSession() call —
    // Supabase fires an INITIAL_SESSION event once it's finished both
    // checking stored sessions AND processing any magic-link/reset tokens
    // in the current URL. A plain getSession() call can run BEFORE that
    // processing finishes, which was the bug: clicking a valid magic link
    // bounced straight back to /login because the session genuinely wasn't
    // there yet at that exact millisecond, not because it failed.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        resolve(session);
      }
    });

    return () => {
      cancelled = true;
      listener?.subscription?.unsubscribe();
    };
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
