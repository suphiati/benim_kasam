import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.suphiatilim.benimkasam',
  appName: 'BenimKasam',
  webDir: 'dist',
  backgroundColor: '#1e3a5f',
  android: {
    backgroundColor: '#1e3a5f',
  },
  ios: {
    backgroundColor: '#1e3a5f',
    // iOS'ta reklam yok: @capacitor-community/admob bu listede OLMADIĞI için iOS
    // projesine hiç bağlanmaz (Google Mobile Ads SDK'sı, ATT izni ve takip beyanı
    // gerekmez; src/services/ads.ts de yalnızca Android'de çalışır).
    // DİKKAT: package.json'a yeni bir Capacitor eklentisi eklenirse iOS'ta çalışması
    // için buraya da eklenmeli — liste dışı eklenti iOS'ta "not implemented" hatası verir.
    includePlugins: [
      '@aparajita/capacitor-biometric-auth',
      '@capacitor/app',
      '@capacitor/filesystem',
      '@capacitor/preferences',
      '@capacitor/share',
      '@capacitor/status-bar',
      '@capawesome/capacitor-app-update',
    ],
  },
};

export default config;
