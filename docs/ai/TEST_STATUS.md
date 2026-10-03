# TEST_STATUS
2026-10-03, Windows host, cwd repo root unless noted. Code baseline 223a8b0 (1.3.2).

| Check | Command/action | Result | Notes |
|---|---|---|---|
| Lint | `npm run lint` | PASS | 0 problems |
| Types + build | `npm run build` | PASS | chunk > 500 kB warning |
| Capacitor sync | `npx cap sync` | PASS | only an EOL-only Package.swift change, discarded |
| Android release build | `gradlew assembleRelease bundleRelease` (android/) | PASS | versionCode 18 / 1.3.2, signed with the upload key |
| RTDB rules | Firebase database emulator 4.11.2 (firebase-tools 13, Java 17), 38 REST cases | PASS | members, non-members, invite window, listing, multi-path claim, malformed writes, legacy and emptied vaults |
| RTDB rules live | throwaway anonymous users on production | PASS | non-member read 401 (200 before deploy); vault create, write and invite-window join 8/8; test data and users deleted |
| Independent review | security-reviewer (rules), bk-money-reviewer (sync diff) | PASS with notes | no blocker; follow-ups in CURRENT_STATE.md |
| Android emulator smoke | release APK on Android 14 AVD (read-only) | PARTIAL | install, launch, main screens and fresh Truncgil rates ("Market: 12 minutes ago") PASS; add transaction NOT RUN |
| Two-device sync, offline/kill/resume, biometric | devices | NOT RUN | needs two devices |
| iOS simulator smoke | .github/workflows/ios.yml | CI | runs on push |
