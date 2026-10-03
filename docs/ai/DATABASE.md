# DATABASE
Rules source: database.rules.json, deployed with `firebase deploy --only database` (production; needs authorization). Rollback: copy database.rules.phase1-rollback.json over it and deploy.

Firebase RTDB (root deny-all):
- config: public read, no client write. minVersionCode and latestVersionCode (numbers), set by the owner.
- vaults/$vaultId: read and write for members only (members/{auth.uid} exists).
- vaults/$vaultId/members/$uid: boolean, key must equal auth.uid. A non-member may write its own entry as true only into a vault that does not exist yet or while openUntil is in the future.
- vaults/$vaultId/openUntil: number, end of the QR invite window, written by a member.
- vaults/$vaultId/transactions/$txId: required type, assetType, date, amount (>= 0), unitPrice (>= 0), createdAt; optional note (<= 2000 chars) and fxSnapshot {USD, EUR} (> 0). Unknown keys rejected.

IndexedDB benim_kasam_db v1: store transactions (keyPath id; indexes by-asset, by-date). The upgrade callback branches on oldVersion, so a DB_VERSION bump needs a new guarded branch.

Ownership: no accounts; every paired device of a vault is a member. The last member to unpair deletes the vault; a vault left without members otherwise (simultaneous unpair, lost device) stays inaccessible and devices pair again into a new vault.
