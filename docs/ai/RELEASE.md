# Release evidence

Status: NO-GO for the next release (not evaluated)
Live: Android 1.3.1 (versionCode 17); iOS 1.3.1 rejected under guideline 2.1, BLOCKED on a physical iPhone
Baseline/target: 5ac8cc4 / next Android versionCode 18
Authorization: preparation only

| Check | Baseline/environment | Command/action | Result | Evidence |
|---|---|---|---|---|
| Types + bundle | 5ac8cc4, clean worktree | tsc + `vite build` | PASS | TEST_STATUS.md |
| Lint | 5ac8cc4, clean worktree | `eslint .` | FAIL (1 error) | TEST_STATUS.md |
| Android release smoke | device | bk-release step 6 | NOT RUN | none |

Blockers: lint error pending in the sync fix; release smoke not run; privacy policy URL on Vercel is down
Rollback: not prepared
External release ID: Play versionCode 17
