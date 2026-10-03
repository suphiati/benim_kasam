---
name: bk-vault-sync
description: BenimKasam shared vault data - Firebase RTDB vaults/members/transactions rules, firebaseSyncService, idb offline cache and QR invites.
---
Read database.rules.json (rollback: database.rules.phase1-rollback.json), src/services/firebaseSyncService.ts, src/db and src/store before changing data flow.

Rules: root stays deny-all; `config` is public read-only; vaults are member-only (live since 2026-10-03). A non-member may only write its own `members/{uid}: true`, and only into a brand-new vault or while `openUntil` (set by a member) is in the future. Every client write must therefore register membership first. Never let a user add arbitrary uids. Validate every transaction field type and reject unknown keys; do not add rules that reject writes legitimate older clients still send.

Sync: transactions carry client-generated ids so retries are idempotent; the local idb cache is the offline source and reconciles on reconnect; deleting or leaving a vault clears its local cache. A rejected write is reverted by the SDK with child_removed; never apply that as a remote delete. On sign-out clear private cached data. QR payloads (`{"v":1,"vault":...}` JSON) are untrusted input; validate the UUID format before using it in a path.

Test rules with the Firebase emulator for member, non-member, anonymous and malformed writes before any `firebase deploy --only database` (production change; needs authorization). Report rules diff, emulator results and migration impact for existing vaults.
