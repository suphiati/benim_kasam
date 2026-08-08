import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  BannerAdSize,
  BannerAdPosition,
  BannerAdPluginEvents,
  AdmobConsentStatus,
} from '@capacitor-community/admob';

// AdMob kimlikleri. APK içinde açık gider, gizli değildir; App ID ayrıca
// AndroidManifest.xml'de com.google.android.gms.ads.APPLICATION_ID meta-data'sı
// olarak da tanımlıdır (Google Mobile Ads SDK olmazsa açılışta çöker).
const BANNER_AD_ID = 'ca-app-pub-9692001502823344/6312945256';

// Yalnızca yayınlanan (production) derlemede gerçek reklam iste; başka her yerde
// test reklamı. Capacitor release APK'sı dist'i production modunda derler
// (import.meta.env.PROD = true). Böylece geliştirirken yanlışlıkla kendi
// reklamına tıklayıp politika ihlali riski oluşmaz.
const IS_TESTING = !import.meta.env.PROD;

let initPromise: Promise<void> | null = null;
let bannerCreated = false;

// Banner yüksekliğini bir CSS değişkenine yaz; #root bu kadar alttan boşluk
// bırakır, böylece alt TabBar native banner'ın ÜstÜnde kalır (çakışmaz).
function setBannerHeightVar(height: number): void {
  const value = height > 0 ? `${height}px` : '0px';
  document.documentElement.style.setProperty('--admob-banner-height', value);
}

async function doInit(): Promise<void> {
  try {
    await AdMob.initialize();

    // GDPR/UMP izni: konsolda bir mesaj tanımlıysa ve gerekiyorsa formu göster.
    // Tanımlı değilse status NOT_REQUIRED döner ve atlanır. Bu akıştaki bir hata
    // banner'ı engellemesin diye ayrıca sarmalanmıştır.
    try {
      const consent = await AdMob.requestConsentInfo();
      if (consent.isConsentFormAvailable && consent.status === AdmobConsentStatus.REQUIRED) {
        await AdMob.showConsentForm();
      }
    } catch {
      /* izin akışı yapılandırılmamış/başarısız: sessizce devam et */
    }

    await AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      setBannerHeightVar(size.height);
    });
    await AdMob.addListener(BannerAdPluginEvents.FailedToLoad, () => {
      setBannerHeightVar(0);
    });
  } catch (err) {
    console.warn('[ads] initialize failed', err);
  }
}

/** AdMob SDK'sını (idempotent) başlatır. Native olmayan platformlarda no-op. */
export function initAds(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve();
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

/** Alt banner'ı gösterir (ilk çağrıda oluşturur, sonrakilerde sürdürür). */
export async function showAppBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await initAds();
  try {
    if (!bannerCreated) {
      await AdMob.showBanner({
        adId: BANNER_AD_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        isTesting: IS_TESTING,
        margin: 0,
      });
      bannerCreated = true;
    } else {
      await AdMob.resumeBanner();
    }
  } catch (err) {
    console.warn('[ads] showBanner failed', err);
    setBannerHeightVar(0);
  }
}

/** Banner'ı gizler (kilit ekranı / gizlilik örtüsü sırasında). */
export async function hideAppBanner(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !bannerCreated) return;
  try {
    await AdMob.hideBanner();
  } catch {
    /* yok say */
  }
  setBannerHeightVar(0);
}
