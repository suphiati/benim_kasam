# Architecture
Inspected 2026-10-02 at 96cc9cc (directory level plus the files named here).

Entrypoints: index.html and src/main.tsx (React 19 SPA on Vite 6, Tailwind, vite-plugin-pwa); Capacitor 8 shell in android/ and ios/ with webDir dist. The privacy page (public/gizlilik.html) is published to GitHub Pages by .github/workflows/pages.yml.

Modules: src/pages (Vault, Transactions, AddTransaction, Settings); src/components (common, form, layout, qr, transactions, vault); src/store/vaultStore.ts (zustand); src/db/indexedDb.ts (idb); src/services (rateService, apiMappers, fxHistoryService, firebaseSyncService, updateService, biometric, ads); src/config/firebase.ts; src/hooks; src/i18n.

Data flow: transactions are written to IndexedDB first and mirrored to RTDB vaults/$vaultId/transactions when the device is paired. Rates come directly from Truncgil (no-store fetch) with a client cache and fallbacks. updateService combines RTDB config (minVersionCode, latestVersionCode) with the native Play in-app update.

Trust boundaries:
- Client and RTDB: anonymous auth; vaults are member-only. New devices join through a member-opened invite window (openUntil) while the QR screen is shown. Transaction fields are schema-validated and unknown keys rejected.
- Client and Truncgil: public GET, no user data. Responses are untrusted and checked for completeness before they replace the cached snapshot.
- QR payloads are untrusted; the vault id format is validated on scan.
- Device: biometric unlock, android:allowBackup="false", production-only CSP injected by vite.config.ts.

External services: Firebase Auth and RTDB (.firebaserc), Truncgil Finans, Frankfurter, GitHub Pages (privacy page), AdMob with consent handling (src/services/ads.ts), Play in-app update (@capawesome/capacitor-app-update), GitHub Actions iOS pipeline (.github/workflows/ios.yml: simulator smoke on push, signed App Store Connect upload on ios-v* tags).

Environments: local Vite dev, Play production track, App Store Connect.
