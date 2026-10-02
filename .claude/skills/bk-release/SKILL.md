---
name: bk-release
description: BenimKasam Android/iOS release prep - version bump, Capacitor sync, minVersionCode/latestVersionCode config, release notes and store assets.
---
Use release-readiness as the gate and capacitor-hybrid for native mechanics.
1. Bump version in one place and propagate to android/app/build.gradle (versionCode/versionName) and iOS build number; confirm the next versionCode is higher than the last published one (see store-assets/release-notes-*.txt).
2. `npm run build` then `npx cap sync`; check `git status` for unexpected native diffs.
3. Write store-assets/release-notes-<version>.txt in Turkish (user-visible changes only, under the store limit).
4. In-app update: decide whether `config/minVersionCode` must change (forced update only for breaking backend/rules changes) and set `latestVersionCode` after the release is live. These are production writes; ask before changing them.
5. AdMob: production ad unit IDs present, test IDs absent; consent flow works.
6. Smoke on a release build: biometric unlock, add transaction, vault sync on two devices, rates offline state, ads/no-ads.
Uploading to Play Console/App Store and changing remote config require explicit authorization. Report version, artifacts, smoke results and pending store steps.
