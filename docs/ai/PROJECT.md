# PROJECT

BenimKasam is a personal tracker for foreign currency, gold and silver kept in a home or bank safe. Users record buy/sell transactions; the app shows live TRY rates, average cost and profit/loss. UI strings exist in Turkish and English (src/i18n); the layout is mobile-first.

Actors: the device owner (anonymous Firebase auth, no sign-up) and the owner's other devices that join the same vault through QR pairing.

Platforms: Android (Google Play production, com.suphiatilim.benimkasam), iOS (App Store review). No web deployment; the privacy page is on GitHub Pages (https://suphiati.github.io/benim_kasam/gizlilik.html).

Acceptance goals: correct money and rate math with tr-TR formatting; data available offline from IndexedDB; multi-device vault sync without duplicates; stale rates never shown as current.

Non-goals: user accounts or profiles, server-side storage beyond the shared vault, moving off Firebase (decision 2026-07).
