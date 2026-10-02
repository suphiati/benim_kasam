# Current state
Updated 2026-10-02 · baseline 5ac8cc4 (main) · app 1.3.1

Live: Android 1.3.1 (versionCode 17) on Play production since 2026-08-22; RTDB config latestVersionCode 17, minVersionCode 0. Next Android versionCode: 18.

iOS: 1.3.1 uploaded from CI. App Review rejected it on 2026-09-11 under guideline 2.1 (information needed, including a screen recording on a physical iPhone). BLOCKED until a physical iPhone is available; reply draft in store-assets/app-store/app-review-2.1-reply.md (untracked).

Web/API: benim-kasam.vercel.app returns 404 DEPLOYMENT_NOT_FOUND for /, /api/rates and /gizlilik.html (checked 2026-10-02). The app falls back to Truncgil directly for rates, but the privacy policy URL used by the stores is down.

Completed 2026-10-02: Factory connection (project pack versioned, docs/ai created, merged worktree upbeat-borg removed); lint fixes in src/components/common/InstallGuide.tsx and eslint ignores for generated android/ios output and .claude.

In progress (separate session, uncommitted working tree): sync fix for "entries added on one paired device never show on the other" in firebaseSyncService.ts, useFirebaseSync.ts, vaultStore.ts and rateService.ts (persisted outbox, reconcile on connect, reconnect on resume). It also removes the last lint error at src/hooks/useFirebaseSync.ts:55. Ships as versionCode 18 after a device check.

Open items:
1. Restore the Vercel deployment (rates proxy and gizlilik.html); needs the owner's authorization.
2. Vault rules phase 2: held until the sync fix ships. Then raise minVersionCode, run emulator tests and a security review, and deploy database.rules.phase2-locked.json with the owner's go-ahead.
3. Android R8: minifyEnabled is false (android/app/build.gradle:38); enabling it needs keep rules and a full device regression.
4. Rates durability: Upstash env vars were not configured at last check (earlier notes; not verified this session). The code is env-gated.
5. iOS 2.1 reply: needs a physical-device recording (BLOCKED).

Next step: restore the privacy policy and rates endpoint, then ship the sync fix as versionCode 18.
