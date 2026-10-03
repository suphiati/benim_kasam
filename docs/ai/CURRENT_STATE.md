# Current state
Updated 2026-10-03 · origin/main · release candidate 1.3.2 (versionCode 18), signed R8 AAB built at b266101

Live: Android 1.3.1 (versionCode 17) on Play production since 2026-08-22; RTDB config latestVersionCode 17, minVersionCode 0. Member-only vault rules are live since 2026-10-03.

iOS: 1.3.1 rejected on 2026-09-11 under guideline 2.1 (needs a screen recording on a physical iPhone). BLOCKED until a physical iPhone is available; reply draft in store-assets/app-store/app-review-2.1-reply.md.

Done 2026-10-03:
- Vault rules: members only; a joiner may add only itself, to a brand-new vault or inside the invite window. Deploy verified on production; rollback file database.rules.phase1-rollback.json (f81e700).
- 1.3.2 prepared (code baseline 223a8b0): sync fix (persisted outbox, reconcile on connect, reconnect on resume, "Bağlantı yok" when access is denied), direct Truncgil rates without the browser cache, version bump, release notes in store-assets/release-notes-1.3.2.txt, `npx cap sync`, CSP now allows api.frankfurter.dev so historical FX snapshots work (checked in the production build). The signed release AAB (R8 on, mapping included) was built from b266101 on 2026-10-03 (android/app/build/outputs/bundle/release/app-release.aab, copy on the owner's Desktop as BenimKasam-1.3.2-18.aab; upload key CN=BenimKasam).
- Sync hardening (f1f83c8): remote records with an unknown asset type, type or malformed date are ignored; the invite window closes on pairing and when the QR screen closes and uses server time; the last member leaving deletes the vault (never the vault the device is currently paired with); legacy rows without type upload as buys; the form and import reject malformed dates.
- R8 enabled for release builds (b266101): Play flagged 1.3.1 with "DEX code optimization below threshold" (obfuscation 1%). Release APK smoke on an Android 14 emulator passed.
- Owner-requested fixes (4757b53, a9e988d): a manually typed price is no longer overwritten by the rate refresh; the QR scan screen no longer restarts the camera when an empty vault fills after pairing; "Delete all" warns that paired devices are wiped too; the one-time "deleted rows may reappear once" note is now in the store release notes; debug builds install side by side as com.suphiatilim.benimkasam.test ("BenimKasam Test"). Test APK: android/app/build/outputs/apk/debug/app-debug.apk (copy on the owner's Desktop).

Verification: TEST_STATUS.md. The release build passed launch and fresh rates on an Android 14 emulator. Core sync scenarios (offline add + kill, delete/edit while the peer is closed, re-pair) passed live with two browser origins; phone-to-phone sync and biometric unlock were NOT RUN.

Open items:
1. Upload 1.3.2 to Play, internal or closed testing first (owner authorization). After production rollout set config/latestVersionCode 18; raise minVersionCode later so v17 devices that never registered update and pair again.
2. Two-device sync check on real devices before the production rollout: the owner tests with the side-by-side APK, using a fresh test vault rather than the real one.
3. Rules: add enum validation for type/assetType once v18 is widespread (older clients must not be rejected).
4. Play recommendations for edge-to-edge (deferred, not blockers): call EdgeToEdge.enable() for Android 14 and older; deprecated window APIs come from @capacitor/status-bar (replaceable with native icon styling), Material Components and the AdMob SDK (library internals). Needs a visual check on an Android 14 or older phone.
5. Rates durability: Upstash env vars not configured at last check (not verified this session).
6. iOS 2.1 reply: needs a physical-device recording (BLOCKED).

Next step: collect the owner's phone test result, then upload the AAB to Play (internal or closed testing first) with the owner's go-ahead.
