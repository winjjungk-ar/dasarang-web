import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getOrInitApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  // apiKey가 없으면 initializeApp이 오류를 내므로 체크
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined') {
    console.warn('[Firebase] API key not configured — skipping initialization');
    return null;
  }
  try {
    return initializeApp(firebaseConfig);
  } catch (e: any) {
    console.error('[Firebase] initializeApp failed:', e?.message);
    return null;
  }
}

const app = getOrInitApp();

// app이 null이면 auth/db도 dummy로 — 클라이언트에서만 실제 사용됨
const dummyAuth = { app: null as any, name: 'dummy' } as any;
const dummyDb = {} as any;

export const auth = app ? getAuth(app) : dummyAuth;
export const db = app ? getFirestore(app) : dummyDb;
export default app;

// Persistence state
let authReady = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize Firebase Auth with best-available persistence.
 * Falls back: LocalStorage → SessionStorage → InMemory.
 * This is critical for Android Chrome where IndexedDB may be restricted.
 */
async function initPersistence(): Promise<void> {
  if (authReady) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      console.log('[Firebase] Using local persistence');
    } catch (e: any) {
      console.warn('[Firebase] Local persistence failed:', e?.message);
      try {
        await setPersistence(auth, browserSessionPersistence);
        console.log('[Firebase] Using session persistence');
      } catch (e2: any) {
        console.warn('[Firebase] Session persistence failed:', e2?.message);
        await setPersistence(auth, inMemoryPersistence);
        console.log('[Firebase] Using in-memory persistence');
      }
    }
    authReady = true;
  })();

  return initPromise;
}

/**
 * Anonymous auth gate — call before any Firestore read/write.
 * Ensures persistence is initialized first (handles Android Chrome restrictions).
 */
export async function ensureAuth(): Promise<boolean> {
  await initPersistence();

  return new Promise<boolean>((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) return resolve(true);
      signInAnonymously(auth)
        .then(() => resolve(true))
        .catch((e: any) => {
          console.error('[Firebase] Anonymous sign-in failed:', e?.message, e?.code);
          resolve(false);
        });
    });
  });
}
