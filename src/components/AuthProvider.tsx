'use client';

import { useEffect } from 'react';
import { ensureAuth } from '@/lib/firebase';

/**
 * Initializes Firebase anonymous authentication on app load.
 * Must be called before any Firestore read/write operations.
 * Firestore rules require request.auth != null — without this,
 * all Firestore operations will fail (or succeed if rules aren't deployed).
 */
export default function AuthProvider() {
  useEffect(() => {
    ensureAuth().then((ok) => {
      if (!ok) console.warn('Firebase Auth initialization failed');
    });
  }, []);

  return null; // No UI — just side effect
}
