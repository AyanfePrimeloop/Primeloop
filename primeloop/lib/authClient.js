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
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.replace('/login');
        return;
      }
      const res = await authedFetch('/api/auth/whoami');
      const data = await res.json();
      if (cancelled) return;
      if (data.role !== role) {
        router.replace('/login');
        return;
      }
      setState({ loading: false, me: data });
    })();
    return () => {
      cancelled = true;
    };
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
