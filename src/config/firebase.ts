import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let db: Database | null = null;
let auth: Auth | null = null;
let authReady: Promise<boolean> | null = null;

function initFirebase(): boolean {
  if (!firebaseConfig.databaseURL) return false;
  if (!app) {
    try {
      app = initializeApp(firebaseConfig);
      db = getDatabase(app);
      auth = getAuth(app);
    } catch {
      console.warn('Firebase başlatılamadı');
      return false;
    }
  }
  return true;
}

export function getFirebaseDb(): Database | null {
  if (!initFirebase()) return null;
  return db;
}

/**
 * Anonim oturum sağlar. Güvenlik kuralları `auth != null` istediği için
 * her okuma/yazmadan önce çağrılmalı. Idempotent: ilk çağrıda giriş yapar,
 * sonraki çağrılar aynı promise'i döner. Anonim UID kalıcıdır (cihaz sabit).
 * Firebase yoksa veya anonim giriş kapalıysa false döner (senkron devre dışı).
 */
export function ensureAuth(): Promise<boolean> {
  if (!initFirebase() || !auth) return Promise.resolve(false);
  if (authReady) return authReady;

  const currentAuth = auth;
  authReady = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => { if (!settled) { settled = true; resolve(ok); } };

    const unsub = onAuthStateChanged(currentAuth, (user) => {
      if (user) { unsub(); finish(true); }
    });

    signInAnonymously(currentAuth).catch((err) => {
      // En sık sebep: Firebase Console'da Anonymous Auth kapalı
      console.warn('Anonim giriş başarısız (Console > Authentication > Anonymous açık mı?):', err?.code || err);
      unsub();
      finish(false);
    });
  });
  return authReady;
}
