# API
The app has no backend API of its own. The Vercel rates proxy (api/rates.ts) was retired on 2026-10-03; it is a mobile app (owner decision).

Rates: src/services/rateService.ts fetches https://finans.truncgil.com/v3/today.json directly with `cache: 'no-store'` (Truncgil sends Cache-Control max-age=315360000) and an 8 s timeout; apiMappers.ts parses Turkish number formats and maps the hyphenated gold keys. A snapshot is used only if it contains every gold and silver item; otherwise the last complete snapshot from localStorage is shown as "markets closed".

Historical FX: src/services/fxHistoryService.ts calls https://api.frankfurter.dev/v1 (ECB reference rates).

Sync and remote config: Firebase RTDB (see DATABASE.md).
