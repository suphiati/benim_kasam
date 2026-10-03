# Release evidence

Target: Android 1.3.2 (versionCode 18), Google Play
Status: NO-GO until the AAB is rebuilt after the remaining work (owner decision) and a two-device sync check passes
Baseline: the next AAB is built from origin/main once the remaining work is done
Authorization: preparation only; Play upload and RTDB config writes need the owner's go-ahead

Artifacts (local, not in git; built from 223a8b0, before the CSP fix, so they must be rebuilt):
- android/app/build/outputs/bundle/release/app-release.aab (signed with the upload key)
- android/app/build/outputs/apk/release/app-release.apk

Release notes: store-assets/release-notes-1.3.2.txt (store text plus internal notes)

| Check | Baseline/environment | Command/action | Result | Evidence |
|---|---|---|---|---|
| Lint, types, build | 223a8b0, Windows | `npm run lint`, `npm run build` | PASS | TEST_STATUS.md |
| Signed AAB/APK | 223a8b0, Windows | gradlew bundleRelease, assembleRelease | PASS | aapt: versionCode 18, versionName 1.3.2 |
| Emulator smoke | Android 14 AVD | launch, main screens, rates | PARTIAL | TEST_STATUS.md |
| Two-device sync | devices | pair, add, edit, delete, offline | NOT RUN | none |
| Vault rules | production | deploy + live checks | PASS | TEST_STATUS.md |

Blockers: AAB not rebuilt yet; two-device sync check not run
Rollback: halt the staged rollout in Play; vault rules via database.rules.phase1-rollback.json
After release: set config/latestVersionCode 18 (owner authorization)
External release ID: none yet
