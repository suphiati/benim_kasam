# Current state
Updated 2026-10-03 · main at the docs commit after f81e700 (local, not pushed) · release candidate 1.3.2 (versionCode 18)

Live: Android 1.3.1 (versionCode 17) on Play production since 2026-08-22; RTDB config latestVersionCode 17, minVersionCode 0. Member-only vault rules are live since 2026-10-03.

iOS: 1.3.1 rejected on 2026-09-11 under guideline 2.1 (needs a screen recording on a physical iPhone). BLOCKED until a physical iPhone is available; reply draft in store-assets/app-store/app-review-2.1-reply.md (untracked).

Done 2026-10-03:
- Vault rules: members only; a joiner may add only itself, to a brand-new vault or inside the invite window. Deploy verified on production; rollback file database.rules.phase1-rollback.json (f81e700).
- 1.3.2 prepared (code baseline 223a8b0): sync fix (persisted outbox, reconcile on connect, reconnect on resume, "Bağlantı yok" when access is denied), direct Truncgil rates without the browser cache, version bump, release notes in store-assets/release-notes-1.3.2.txt, `npx cap sync`, signed AAB and APK built locally (not uploaded).

Verification: TEST_STATUS.md. The release build passed launch and fresh rates on an Android 14 emulator; two-device sync, offline/kill/resume and biometric unlock were NOT RUN.

Open items:
1. Upload 1.3.2 to Play, internal or closed testing first (owner authorization). After production rollout set config/latestVersionCode 18; raise minVersionCode later so v17 devices that never registered update and pair again.
2. Two-device sync check on real devices before the production rollout.
3. Sync hardening for a 1.3.x follow-up: validate remote records (assetType, type, date) before applying them, close the invite window on pairing and modal close, use server time for openUntil, delete the vault when its last member leaves; afterwards add enum validation to the rules.
4. CSP connect-src lacks https://api.frankfurter.dev (vite.config.ts), so historical FX snapshots are never stamped in production builds.
5. Android R8: minifyEnabled is false (android/app/build.gradle:38).
6. Rates durability: Upstash env vars not configured at last check (not verified this session).
7. iOS 2.1 reply: needs a physical-device recording (BLOCKED).

Next step: the owner decides the 1.3.2 upload track.
