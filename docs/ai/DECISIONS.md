# Decisions

- 2026-07: Keep Firebase RTDB; no Supabase migration. Evidence: free quota covers usage. Tradeoff: rules-based authorization instead of SQL policies. Boundary: sync, auth.
- 2026-08-05: Harden vault rules in phases. Phase 1 (record members/$uid and openUntil, field validation) is live; the member-only lock in database.rules.phase2-locked.json is deployed only after the membership-writing app version has spread. Tradeoff: temporary broad access versus forcing old clients to re-pair. Boundary: RTDB rules, firebaseSyncService, QR pairing.
- Rates go through api/rates.ts on Vercel fra1 with a completeness gate (no currency-only 200 when gold is missing), an optional Upstash last-good snapshot and CDN stale-if-error. Tradeoff: one more hop for resilient data. Boundary: api/, rateService.
- Hybrid update (v1.2.9): RTDB config minVersionCode forces an update, latestVersionCode prompts one, plus native Play in-app update. Boundary: updateService, RTDB config.
- iOS builds and signing run on GitHub Actions macOS runners with codemagic-cli-tools; signed upload only on ios-v* tags (51a3b8d). Tradeoff: no local Mac, so physical-device checks stay manual.
- 2026-10-02: Phase-2 lock deploy held until the sync fix ships. Evidence: in v17 a rejected write's SDK revert (child_removed) is applied as a remote delete, and paired devices missing from members would stop syncing while the UI still shows synced. Boundary: RTDB rules, firebaseSyncService, release order (fix first, raise minVersionCode, then deploy rules).
- 2026-10-02: Factory connection. The project pack (.claude/factory-project.md, agents/, skills/) is versioned through .gitignore exceptions; global agents/skills stay in ~/.claude only.
