# TEST_STATUS
2026-10-02, Windows. Results for commit 5ac8cc4 come from a clean worktree (cwd: its root), because the main working tree holds another session's uncommitted sync changes.

| Check | Command/action | Result | Notes |
|---|---|---|---|
| Types | `tsc -p tsconfig.app.json`, `tsc -p tsconfig.node.json` | PASS | same projects as `npm run build` |
| Bundle | `vite build` | PASS | worktree had no .env, so VITE_* values were empty; full `npm run build` with .env at 96cc9cc also PASS (chunk > 500 kB warning) |
| Lint | `eslint .` | FAIL (1 error) | react-hooks/set-state-in-effect at src/hooks/useFirebaseSync.ts:55; the fix is part of the pending sync change. Generated android/ios output is ignored now. |
| Unit/e2e | none configured | NOT RUN | no test script in package.json |
| RTDB rules phase 2 | Firebase emulator | NOT RUN | deploy held |
| Android device/emulator | release smoke (bk-release step 6) | NOT RUN | no device in this session |
| iOS simulator smoke | .github/workflows/ios.yml | CI | runs on every push |

Uncovered acceptance cases: multi-device vault sync, offline rates state and biometric unlock need a device run.
