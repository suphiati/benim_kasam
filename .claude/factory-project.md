# Factory profile — BenimKasam
Stack: Vite + React + TypeScript + zustand + idb, Capacitor (Android/iOS), Firebase Realtime Database + Auth, Vercel function `api/rates.ts`, AdMob, biometric unlock, in-app update.
- Web/UI: web-frontend + react-spa-web + ui-implementation.
- Native shell: capacitor-hybrid; ads: mobile-ads-consent; store: store-release + store-listing-aso.
- Data/rules: backend-database + firebase-backend + bk-vault-sync. Money math: bk-money-reviewer before merge.
- Rates: bk-rates. Release: bk-release (versionCode, minVersionCode config, release notes in store-assets/).
- Gate: `npm run lint` and `npm run build`; native changes need an Android device/emulator run.
