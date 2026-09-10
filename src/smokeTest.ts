import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { ref, get } from 'firebase/database';
import { ensureAuth, getCurrentUid, getFirebaseDb } from './config/firebase';
import { getBiometricStatus } from './services/biometric';

/**
 * iOS CI duman testi — YALNIZCA `VITE_SMOKE_TEST=1` ile derlenen simülatör yapısında çalışır
 * (normal derlemede main.tsx'teki dinamik import elenir, bu dosya pakete hiç girmez).
 *
 * Mac olmadan iOS'a özgü riskli yolları doğrular: Firebase anonim oturumu (Capacitor iOS'ta
 * getAuth takılması), RTDB okuma (capacitor:// kökeninden) ve native eklenti köprüsü. Kur
 * verisi ayrıca doğrulanmaz: Header'daki "Piyasa: ..." satırı ekran görüntüsünde görünür.
 *
 * Sonuçlar üç yere yazılır: konsola, ekranın ortasına (ekran görüntüsünde okunur) ve
 * uygulamanın Documents/smoke.txt dosyasına. CI bu dosyayı simülatördeki uygulama kabından
 * okur (`simctl get_app_container`) ve `[smoke] done` satırını bekler. Konsola güvenilmez:
 * stdout TTY değilken tamponlanır, uygulama açıkken dışarı hiç düşmeyebilir.
 */
const TIMEOUT_MS = 20_000;

function withTimeout<T>(p: Promise<T>): Promise<T | 'timeout'> {
  return Promise.race([
    p,
    new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), TIMEOUT_MS)),
  ]);
}

function render(lines: string[]): void {
  let el = document.getElementById('smoke-report');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'smoke-report';
    el.style.cssText =
      'position:fixed;left:0;right:0;top:40%;z-index:99999;margin:0;padding:8px;' +
      'background:rgba(0,0,0,.85);color:#4ade80;font:12px/1.5 monospace;' +
      'white-space:pre-wrap;pointer-events:none';
    document.body.appendChild(el);
  }
  el.textContent = lines.join('\n');
}

// Yazmalar sıraya alınır: art arda writeFile çağrıları birbirini ezmesin.
let writeChain: Promise<unknown> = Promise.resolve();

function persist(lines: string[]): void {
  const data = lines.join('\n') + '\n';
  writeChain = writeChain
    .then(() => Filesystem.writeFile({ path: 'smoke.txt', directory: Directory.Documents, data, encoding: Encoding.UTF8 }))
    .catch((err) => console.warn('[smoke] sonuç dosyası yazılamadı', err));
}

export async function runSmokeTest(): Promise<void> {
  const lines: string[] = [];
  const report = (key: string, value: string) => {
    const line = `[smoke] ${key}=${value}`;
    console.log(line);
    lines.push(line);
    render(lines);
    persist(lines);
  };

  report('platform', Capacitor.getPlatform());

  try {
    const ok = await withTimeout(ensureAuth());
    report('auth', ok === 'timeout' ? 'timeout' : ok ? `ok uid=${getCurrentUid() ? 'yes' : 'no'}` : 'failed');
  } catch (err) {
    report('auth', `error ${String(err)}`);
  }

  try {
    const db = getFirebaseDb();
    const snap = db ? await withTimeout(get(ref(db, 'config'))) : null;
    if (snap === null) report('db', 'no-config');
    else if (snap === 'timeout') report('db', 'timeout');
    else report('db', `ok latestVersionCode=${String(snap.val()?.latestVersionCode)}`);
  } catch (err) {
    report('db', `error ${String(err)}`);
  }

  try {
    const bio = await getBiometricStatus();
    report('biometric', `bridge-ok available=${bio.available} secure=${bio.deviceSecure}`);
  } catch (err) {
    report('biometric', `error ${String(err)}`);
  }

  report('done', 'true');
  await writeChain;
}
