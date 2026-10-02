# DATABASE
Rules source: database.rules.json, deployed with `firebase deploy --only database` (production; needs authorization). Prepared successor: database.rules.phase2-locked.json.

Firebase RTDB (root deny-all):
- config: public read, no client write. minVersionCode and latestVersionCode (numbers), set by the owner.
- vaults/$vaultId/members/$uid: boolean, key must equal auth.uid.
- vaults/$vaultId/openUntil: number, end of the QR invite window.
- vaults/$vaultId/transactions/$txId: required type, assetType, date, amount (>= 0), unitPrice (>= 0), createdAt; optional note (<= 2000 chars) and fxSnapshot {USD, EUR} (> 0). Unknown keys rejected.

IndexedDB benim_kasam_db v1: store transactions (keyPath id; indexes by-asset, by-date). The upgrade callback branches on oldVersion, so a DB_VERSION bump needs a new guarded branch.

Ownership: no accounts; every paired device shares the vault. Phase-2 order: ship the membership-writing app version, let it spread, then deploy the locked rules.
