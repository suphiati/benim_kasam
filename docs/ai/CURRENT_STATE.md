# Current state
Updated 2026-10-03 · origin/main · release candidate 1.3.2 (versionCode 18), AAB not built yet

Live: Android 1.3.1 (versionCode 17) on Play production since 2026-08-22; RTDB config latestVersionCode 17, minVersionCode 0. Member-only vault rules are live since 2026-10-03.

iOS: 1.3.1 rejected on 2026-09-11 under guideline 2.1 (needs a screen recording on a physical iPhone). BLOCKED until a physical iPhone is available; reply draft in store-assets/app-store/app-review-2.1-reply.md.

Done 2026-10-03:
- Vault rules: members only; a joiner may add only itself, to a brand-new vault or inside the invite window. Deploy verified on production; rollback file database.rules.phase1-rollback.json (f81e700).
- 1.3.2 prepared (code baseline 223a8b0): sync fix (persisted outbox, reconcile on connect, reconnect on resume, "Bağlantı yok" when access is denied), direct Truncgil rates without the browser cache, version bump, release notes in store-assets/release-notes-1.3.2.txt, `npx cap sync`, CSP now allows api.frankfurter.dev so historical FX snapshots work (checked in the production build). The release AAB is built last, once all remaining work is done (owner decision); the local AAB from 223a8b0 is outdated.
- Sync hardening (uncommitted): remote records with an unknown asset type, type or malformed date are ignored; the invite window closes on pairing and when the QR screen closes and uses server time; the last member leaving deletes the vault (never the vault the device is currently paired with); legacy rows without type upload as buys; the form and import reject malformed dates.

Verification: TEST_STATUS.md. The release build passed launch and fresh rates on an Android 14 emulator; two-device sync, offline/kill/resume and biometric unlock were NOT RUN.

Open items:
1. Upload 1.3.2 to Play, internal or closed testing first (owner authorization). After production rollout set config/latestVersionCode 18; raise minVersionCode later so v17 devices that never registered update and pair again.
2. Two-device sync check on real devices before the production rollout.
3. Rules: add enum validation for type/assetType once v18 is widespread (older clients must not be rejected).
4. Android R8: minifyEnabled is false (android/app/build.gradle:38).
5. Rates durability: Upstash env vars not configured at last check (not verified this session).
6. iOS 2.1 reply: needs a physical-device recording (BLOCKED).

Next step: finish the remaining 1.3.2 work, then build the AAB (`npm run build`, `npx cap sync`, `gradlew bundleRelease`) and upload with the owner's go-ahead.
