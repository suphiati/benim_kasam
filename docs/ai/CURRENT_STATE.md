# Current state
Updated 2026-10-03 · origin/main · 1.3.3 (versionCode 19) live on Play production; iOS 1.3.3 (16.1) prepared in App Store Connect, not submitted

Live: Android 1.3.3 (versionCode 19) on Play production since 2026-10-03 (full rollout; the public store page shows 1.3.3). RTDB config latestVersionCode 19, minVersionCode 0 (set 2026-10-03 via firebase-tools). Member-only vault rules are live since 2026-10-03. Play store listing website: https://suphiati.github.io/benim_kasam/.

Play history: 18 (1.3.2) went live 2026-10-03 17:29 with the new privacy policy and data safety URLs; 19 (1.3.3) was submitted the same evening and approved. For both, the AD_ID declaration error (an older active build lacks the permission; 18 and 19 have it) was ignored for the release, the same decision as for 17.

iOS: App Store Connect version 1.3.3 is "Prepare for Submission" with build 1.3.3 (16.1); Support URL https://suphiati.github.io/benim_kasam/ and App Privacy policy URL https://suphiati.github.io/benim_kasam/gizlilik.html. It was NOT resubmitted: the 2.1 rejection of 1.3.1 (2026-09-11) asks for a screen recording on a physical iPhone. When the recording exists, attach it to the reply (draft: store-assets/app-store/app-review-2.1-reply.md) and press "Update Review".

Done 2026-10-03:
- Vault rules: members only; a joiner may add only itself, to a brand-new vault or inside the invite window. Deploy verified on production; rollback file database.rules.phase1-rollback.json (f81e700).
- 1.3.2 (code baseline 223a8b0): sync fix (persisted outbox, reconcile on connect, reconnect on resume, "Bağlantı yok" when access is denied), direct Truncgil rates without the browser cache, CSP allows api.frankfurter.dev; AAB from b266101 (R8 on).
- Sync hardening (f1f83c8): remote records with an unknown asset type, type or malformed date are ignored; the invite window closes on pairing and when the QR screen closes and uses server time; the last member leaving deletes the vault (never the vault the device is currently paired with); legacy rows without type upload as buys; the form and import reject malformed dates.
- R8 for release builds (b266101): Play flagged 1.3.1 with "DEX code optimization below threshold" (obfuscation 1%). Release APK smoke on an Android 14 emulator passed, including biometric unlock.
- 1.3.3 / versionCode 19 (a9836ab, tag ios-v1.3.3): rates straight from Truncgil, the Vercel proxy and its files removed (997ec9d, a493d73). AAB on the owner's Desktop as BenimKasam-1.3.3-19.aab; iOS build uploaded by GitHub Actions run 37133124230.
- Owner-requested fixes (4757b53, a9e988d): a manually typed price is no longer overwritten by the rate refresh; the QR scan screen no longer restarts the camera when an empty vault fills after pairing; "Delete all" warns that paired devices are wiped too; debug builds install side by side as com.suphiatilim.benimkasam.test ("BenimKasam Test").
- Privacy policy on GitHub Pages (441858d, .github/workflows/pages.yml publishes only public/gizlilik.html): https://suphiati.github.io/benim_kasam/gizlilik.html, used by Play (privacy, data deletion, website) and App Store Connect.

Verification: TEST_STATUS.md. Core sync scenarios passed live with two browser origins; the R8 release build passed on an Android 14 emulator (launch, rates, add, export, QR camera, biometric unlock). Phone-to-phone sync was NOT RUN (the owner tests on the live version).

Open items:
1. Raise minVersionCode later (production write, owner go-ahead) so v17 devices that never registered update and pair again.
2. Phone-to-phone sync check on the live build (owner).
3. Rules: add enum validation for type/assetType once v18+ is widespread (older clients must not be rejected).
4. Play recommendations for edge-to-edge (deferred, not blockers): call EdgeToEdge.enable() for Android 14 and older; deprecated window APIs come from @capacitor/status-bar (replaceable with native icon styling), Material Components and the AdMob SDK (library internals). Needs a visual check on an Android 14 or older phone.
5. iOS resubmission: needs the physical-iPhone screen recording (BLOCKED); everything else in App Store Connect is ready.
6. Optional: delete the unused VITE_API_BASE_URL line from .env/.env.example and the GitHub secret.

Next step: the owner tests sync on the live 1.3.3; iOS resubmission when the recording exists. Next Android versionCode: 20.
