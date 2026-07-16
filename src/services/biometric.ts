import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { useVaultStore } from '../store/vaultStore';
import { translate, type TKey } from '../i18n';

const LOCK_ENABLED_KEY = 'biometric_lock_enabled';

// Servis olduğu için hook kullanamaz; dili store'dan anlık okur.
// authenticate() kullanıcı etkileşimiyle çağrıldığından store hazır olur.
function t(key: TKey): string {
  return translate(useVaultStore.getState().language, key);
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export interface BiometricStatus {
  /** Biyometri (parmak izi/yüz) kayıtlı ve kullanılabilir */
  available: boolean;
  /** Cihazda en az PIN/şifre var (kilit için yeterli) */
  deviceSecure: boolean;
}

// Cihazın biyometri/PIN durumu. Web'de her zaman kapalı döner.
export async function getBiometricStatus(): Promise<BiometricStatus> {
  if (!isNative()) return { available: false, deviceSecure: false };
  try {
    const info = await BiometricAuth.checkBiometry();
    return { available: info.isAvailable, deviceSecure: info.deviceIsSecure };
  } catch {
    return { available: false, deviceSecure: false };
  }
}

// Kimlik doğrula. Biyometri yoksa cihaz PIN/şifresine düşer.
// Başarılıysa true, iptal/başarısızlıkta false döner (BiometryError yutulur).
export async function authenticate(): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({
      reason: t('lock.reason'),
      cancelTitle: t('common.cancel'),
      allowDeviceCredential: true, // biyometri yoksa/başarısızsa PIN/şifre
      iosFallbackTitle: t('lock.iosFallback'),
      androidTitle: 'BenimKasam', // marka adı - çevrilmez
      androidSubtitle: t('lock.androidSubtitle'),
      androidConfirmationRequired: false,
    });
    return true;
  } catch {
    return false;
  }
}

// Kilit ayarı (Preferences = native güvenli depolama). Varsayılan: açık.
export async function isLockEnabled(): Promise<boolean> {
  if (!isNative()) return false;
  const { value } = await Preferences.get({ key: LOCK_ENABLED_KEY });
  return value === null ? true : value === 'true';
}

export async function setLockEnabled(enabled: boolean): Promise<void> {
  await Preferences.set({ key: LOCK_ENABLED_KEY, value: String(enabled) });
}
