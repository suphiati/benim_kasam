---
name: bk-vault-sync
description: BenimKasam shared vault data - Firebase RTDB vaults/members/transactions rules, firebaseSyncService, idb offline cache and QR invites.
---
Read database.rules.json (and database.rules.phase2-locked.json), src/services/firebaseSyncService.ts, src/db and src/store before changing data flow.

Rules: root stays deny-all; `config` is public read-only; vault access moves to member-only in phases. Phase 1 (members/$uid and openUntil recorded, field validation) is live; the member-only lock is prepared in database.rules.phase2-locked.json and ships only after the client handles rejected writes and paired devices are registered as members. Never let a user add arbitrary uids. Validate every transaction field type and reject unknown keys.

Sync: transactions carry client-generated ids so retries are idempotent; the local idb cache is the offline source and reconciles on reconnect; deleting or leaving a vault clears its local cache. A rejected write is reverted by the SDK with child_removed; never apply that as a remote delete. On sign-out clear private cached data. QR payloads (`{"v":1,"vault":...}` JSON) are untrusted input; validate the UUID format before using it in a path.

Test rules with the Firebase emulator for member, non-member, anonymous and malformed writes before any `firebase deploy --only database` (production change; needs authorization). Report rules diff, emulator results and migration impact for existing vaults.
