# Current state
Updated 2026-10-03 · origin/main · 1.3.2 (versionCode 18) live on Play production; 1.3.3 (versionCode 19) built: Android AAB ready, iOS build 1.3.3 (16.1) uploaded to App Store Connect

Live: Android 1.3.2 (versionCode 18) on Play production since 2026-10-03 17:29 (full rollout); RTDB config latestVersionCode 18 (set 2026-10-03 via firebase-tools), minVersionCode 0. Member-only vault rules are live since 2026-10-03. Play store listing website: https://suphiati.github.io/benim_kasam/.

Review: Google approved 18 the same day; it went out with the new privacy policy and data safety URLs. The AD_ID declaration error (an older active build lacks the permission; 18 has it) was ignored for this release, the same decision as for 17.

iOS: 1.3.1 rejected on 2026-09-11 under guideline 2.1 (needs a screen recording on a physical iPhone). BLOCKED until a physical iPhone is available; reply draft in store-assets/app-store/app-review-2.1-reply.md.

Done 2026-10-03:
- Vault rules: members only; a joiner may add only itself, to a brand-new vault or inside the invite window. Deploy verified on production; rollback file database.rules.phase1-rollback.json (f81e700).
- 1.3.2 (code baseline 223a8b0): sync fix (persisted outbox, reconcile on connect, reconnect on resume, "Bağlantı yok" when access is denied), direct Truncgil rates without the browser cache, CSP allows api.frankfurter.dev, release notes in store-assets/release-notes-1.3.2.txt. The uploaded AAB was built from b266101 (R8 on, mapping included, upload key CN=BenimKasam; copy on the owner's Desktop as BenimKasam-1.3.2-18.aab).
- Sync hardening (f1f83c8): remote records with an unknown asset type, type or malformed date are ignored; the invite window closes on pairing and when the QR screen closes and uses server time; the last member leaving deletes the vault (never the vault the device is currently paired with); legacy rows without type upload as buys; the form and import reject malformed dates.
- R8 for release builds (b266101): Play flagged 1.3.1 with "DEX code optimization below threshold" (obfuscation 1%). Release APK smoke on an Android 14 emulator passed, including biometric unlock.
- 1.3.3 / versionCode 19 (a9836ab, tag ios-v1.3.3): ships the direct Truncgil rate fetch (997ec9d). Signed AAB on the owner's Desktop as BenimKasam-1.3.3-19.aab (not uploaded to Play yet). iOS: GitHub Actions run 37133124230 passed the simulator smoke and uploaded build 1.3.3 (16.1) to App Store Connect (delivery 138ed6b8-3fc6-4a24-8b87-b0935f5aceba); not submitted for review.
- Owner-requested fixes (4757b53, a9e988d): a manually typed price is no longer overwritten by the rate refresh; the QR scan screen no longer restarts the camera when an empty vault fills after pairing; "Delete all" warns that paired devices are wiped too; the one-time "deleted rows may reappear once" note is in the store release notes; debug builds install side by side as com.suphiatilim.benimkasam.test ("BenimKasam Test").
- Privacy policy moved to GitHub Pages (441858d, .github/workflows/pages.yml publishes only public/gizlilik.html): https://suphiati.github.io/benim_kasam/gizlilik.html. The old benim-kasam.vercel.app URLs returned 404 and blocked the Play review; Play's privacy policy and data deletion URLs and the App Store listing notes now use the new address.

Verification: TEST_STATUS.md. Core sync scenarios passed live with two browser origins; the R8 release build passed on an Android 14 emulator (launch, rates, add, export, QR camera, biometric unlock). Phone-to-phone sync was NOT RUN.

Open items:
1. Raise minVersionCode later (production write, owner go-ahead) so v17 devices that never registered update and pair again.
2. Phone-to-phone sync check on the live build: the owner tests directly on the live version.
3. Retired proxy removed from the code in main (rates direct from Truncgil, CSP without the Vercel origin); ships with the next build. The VITE_API_BASE_URL line in .env is now unused.
4. Rules: add enum validation for type/assetType once v18 is widespread (older clients must not be rejected).
5. Play recommendations for edge-to-edge (deferred, not blockers): call EdgeToEdge.enable() for Android 14 and older; deprecated window APIs come from @capacitor/status-bar (replaceable with native icon styling), Material Components and the AdMob SDK (library internals). Needs a visual check on an Android 14 or older phone.
6. iOS 2.1 reply: needs a physical-device recording (BLOCKED); the new iOS build should carry the same fixes and the GitHub Pages privacy URL.

Next step: upload BenimKasam-1.3.3-19.aab to Play with the owner's go-ahead and set config/latestVersionCode 19 once it is live; iOS resubmission waits for the 2.1 physical-iPhone recording.
