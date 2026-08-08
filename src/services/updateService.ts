import { Capacitor } from '@capacitor/core';
import {
  AppUpdate,
  AppUpdateAvailability,
  AppUpdateResultCode,
} from '@capawesome/capacitor-app-update';
import { ref, get } from 'firebase/database';
import { getFirebaseDb } from '../config/firebase';

/**
 * HİBRİT güncelleme kontrolü:
 *  - Firebase `config` (senin kontrolün): minVersionCode => ZORUNLU eşiği, latestVersionCode
 *    => OPSİYONEL eşiği. Play propagasyonunu beklemeden bir sürümü "zorunlu" ilan edebilirsin.
 *  - Play In-App Updates (native gerçekleştirme): getAppUpdateInfo ile Play'de güncelleme var mı,
 *    immediate/flexible destekleniyor mu. Play yoksa/sideload ise sessizce atlanır.
 *  - Play Store yönlendirme: native in-app update mümkün değilse son çare (openAppStore).
 *
 * Karar sırası: ZORUNLU (Firebase min) > OPSİYONEL (Play veya Firebase latest) > yok.
 */
export type UpdateDecision =
  | { kind: 'none' }
  | { kind: 'optional'; canFlexible: boolean }
  | { kind: 'forced'; canImmediate: boolean };

interface RemoteConfig {
  minVersionCode: number;
  latestVersionCode: number;
}

// config `.read: true` (auth gerektirmez): açılışta anonim oturumu beklemeden okunur.
async function getRemoteConfig(): Promise<RemoteConfig | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  try {
    const snap = await get(ref(db, 'config'));
    const val = snap.val() as { minVersionCode?: unknown; latestVersionCode?: unknown } | null;
    if (!val) return null;
    return {
      minVersionCode: Number(val.minVersionCode) || 0,
      latestVersionCode: Number(val.latestVersionCode) || 0,
    };
  } catch {
    return null;
  }
}

type NativeInfo = Awaited<ReturnType<typeof AppUpdate.getAppUpdateInfo>>;

async function getNativeInfo(): Promise<NativeInfo | null> {
  try {
    return await AppUpdate.getAppUpdateInfo();
  } catch {
    // Play Store yok (sideload/emülatör), ağ hatası vb. → native güncelleme kanalı pasif
    return null;
  }
}

/**
 * Güncelleme durumunu değerlendirir. Web/PWA'da her zaman 'none' (SW autoUpdate zaten var).
 * Native'de: mevcut versionCode'u Play'den (yoksa 0), eşikleri Firebase'den alır.
 */
export async function checkForUpdate(): Promise<UpdateDecision> {
  if (!Capacitor.isNativePlatform()) return { kind: 'none' };

  const [info, remote] = await Promise.all([getNativeInfo(), getRemoteConfig()]);

  const current = info ? Number(info.currentVersionCode) || 0 : 0;

  // ZORUNLU: Firebase minVersionCode, cihazdaki sürümün üstündeyse. (current 0 ise
  // Play bilgisi yok demektir - yanlış "zorunlu" tetiklememek için current>0 şartı.)
  const forced = !!remote && current > 0 && current < remote.minVersionCode;
  if (forced) {
    return { kind: 'forced', canImmediate: !!info?.immediateUpdateAllowed };
  }

  // OPSİYONEL: Play "güncelleme var" diyor VEYA Firebase latestVersionCode daha yeni.
  const playHasUpdate = info?.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE;
  const remoteHasNewer = !!remote && current > 0 && current < remote.latestVersionCode;
  if (playHasUpdate || remoteHasNewer) {
    return { kind: 'optional', canFlexible: !!info?.flexibleUpdateAllowed };
  }

  return { kind: 'none' };
}

/** Play Store uygulama sayfasını açar (son çare / native update mümkün değilken). */
export async function openStore(): Promise<void> {
  try {
    await AppUpdate.openAppStore();
  } catch {
    /* yok say */
  }
}

/**
 * ZORUNLU güncelleme: native tam ekran immediate update dener; mümkün değilse/başarısızsa
 * Play Store'a yönlendirir. Çağıran UI bloke edici kalmalı (kullanıcı güncellemeden geçmesin).
 */
export async function runForcedUpdate(canImmediate: boolean): Promise<void> {
  if (canImmediate) {
    try {
      const res = await AppUpdate.performImmediateUpdate();
      if (res.code === AppUpdateResultCode.OK) return; // uygulama güncellemeye gider
    } catch {
      /* aşağıda store'a düş */
    }
  }
  await openStore();
}

/**
 * OPSİYONEL güncelleme: mümkünse native flexible update (arka planda indir + yeniden başlat),
 * değilse Play Store yönlendirme. Kullanıcı iptal ederse sessizce döner.
 */
export async function runOptionalUpdate(canFlexible: boolean): Promise<void> {
  if (canFlexible) {
    try {
      const res = await AppUpdate.startFlexibleUpdate();
      if (res.code === AppUpdateResultCode.OK) {
        await AppUpdate.completeFlexibleUpdate(); // indirme bitti → yeniden başlat
        return;
      }
      if (res.code === AppUpdateResultCode.CANCELED) return; // kullanıcı vazgeçti
    } catch {
      /* aşağıda store'a düş */
    }
  }
  await openStore();
}
