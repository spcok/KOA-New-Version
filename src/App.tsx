/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';

export default function App() {
  const setSession = useAuthStore(s => s.setSession);

  React.useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return <RouterProvider router={router} />;
}
