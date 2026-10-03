# TEST_STATUS
2026-10-03, Windows host, cwd repo root unless noted. Code baseline 223a8b0 (1.3.2); lint and build re-run after the CSP fix: PASS.

| Check | Command/action | Result | Notes |
|---|---|---|---|
| Lint | `npm run lint` | PASS | 0 problems |
| Types + build | `npm run build` | PASS | chunk > 500 kB warning |
| CSP | production build served by `vite preview`, fetch from the page | PASS | api.frankfurter.dev 200; example.com blocked (CSP active) |
| Capacitor sync | `npx cap sync` | PASS | only an EOL-only Package.swift change, discarded |
| Android release build | `npm run build`, `npx cap sync`, `gradlew bundleRelease` (android/) at b266101 | PASS | R8 on, mapping in BUNDLE-METADATA; versionCode 18 / 1.3.2, signed with the upload key (CN=BenimKasam); bundle contains the current web build (index-BpOquhc6.js); cap sync left only an EOL-only Package.swift change, discarded |
| RTDB rules | Firebase database emulator 4.11.2 (firebase-tools 13, Java 17), 38 REST cases | PASS | members, non-members, invite window, listing, multi-path claim, malformed writes, legacy and emptied vaults |
| RTDB rules live | throwaway anonymous users on production | PASS | non-member read 401 (200 before deploy); vault create, write and invite-window join 8/8; test data and users deleted |
| Independent review | security-reviewer (rules), bk-money-reviewer (sync diff) | PASS with notes | no blocker; follow-ups in CURRENT_STATE.md |
| R8 release smoke | R8 release APK (b266101) on Android 14 AVD tasiapp_phone (read-only) | PASS | launch, live rates ("Market: 9 minutes ago"), add transaction and vault totals, export via native share sheet, QR camera permission and camera open, back and relaunch, biometric lock on cold start with an enrolled emulator fingerprint (prompt shown, unlocked); crash buffer empty. Ads and in-app update NOT RUN |
| Android emulator smoke (pre-R8) | release APK on Android 14 AVD (read-only) | PARTIAL | install, launch, main screens and fresh Truncgil rates ("Market: 12 minutes ago") PASS; add transaction NOT RUN |
| Sync hardening E2E | dev build, three browser origins as three devices, production Firebase | PASS | pairing in window; window closed after pairing (openUntil null, late device denied); valid remote record applied, invalid asset type and date ignored without crash; peer leave removes only its membership; last member leave deletes the vault, local rows kept; test vault and users deleted. Ran before the review follow-ups (stricter date check, guard against leaving the current vault, closing the window first); lint and build re-run after them: PASS |
| Core sync E2E (outbox/reconcile) | dev build at 31285d5 + UI fixes, two browser origins as two devices, production Firebase (owner approved) | PASS | pairing with union of both devices' rows; live add; offline add, page killed, reopened -> reached peer; delete and edit while peer closed -> applied on reopen; unpair + re-pair same vault -> rows deleted meanwhile came back once (documented); live delete. Test vault and both anonymous users deleted, browser storage cleared |
| UI fixes in running app | same dev build | PASS | manual price kept after rate refresh (autofill 6542.72, typed 6000 stayed); scan modal not remounted when an empty vault fills (same DOM node); clear-all text names paired devices when a vault is set |
| Side-by-side test APK | `npm run build`, `npx cap sync android`, `gradlew assembleDebug` | PASS | com.suphiatilim.benimkasam.test, 1.3.2 (18), label "BenimKasam Test"; installs next to the Play app with separate data |
| Two-device sync on phones, offline/kill/resume, biometric | devices | NOT RUN | owner will test with the side-by-side APK |
| iOS simulator smoke | .github/workflows/ios.yml | CI | runs on push |
| Privacy page hosting | GitHub Pages workflow run 37128273401 (441858d) | PASS | https://suphiati.github.io/benim_kasam/gizlilik.html returns 200 with the policy title; Play quick checks passed and 3 changes were sent for review |
