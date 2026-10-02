# COMPONENT_MAP
Inspected 2026-10-02; only paths relevant to open items.

- src/components/qr/QrGenerateModal.tsx, QrScanModal.tsx: QR pairing (join, upload, invite window, peer watch, abandon).
- src/services/firebaseSyncService.ts: membership, listeners and writes; rejected-write handling is part of the pending sync fix.
- src/hooks/useFirebaseSync.ts: reconnects to the stored vault on mount (lint error at line 55, fixed in the pending sync change).
- src/services/updateService.ts: RTDB config versions and native in-app update.
- src/smokeTest.ts: iOS CI smoke test, bundled only with VITE_SMOKE_TEST=1; reads only RTDB config.
