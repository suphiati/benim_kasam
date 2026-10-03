---
name: bk-rates
description: BenimKasam currency/gold rate pipeline - direct Truncgil fetch, Turkish number formats, caching, history (fxHistoryService) and stale-rate handling.
---
Read src/services/rateService.ts, apiMappers.ts and fxHistoryService.ts first. There is no backend: the app calls finans.truncgil.com/v3 directly.

- Upstream sources return Turkish formatted numbers ("1.234,56") or plain numbers; parse with the existing parsePrice helper (apiMappers.ts) and unit-test both formats, empty values and dashes. Never use parseFloat directly on Turkish strings.
- Buying vs Selling: holdings valuation uses one documented side consistently (state which in UI); never mix sides within a total.
- Fetch Truncgil with `cache: 'no-store'` (it sends Cache-Control max-age=315360000, so a default fetch freezes rates) and keep the client cache with a timestamp. Show "last updated" and a stale indicator when data is older than the threshold or offline; never show zero as a rate on failure.
- Gold types (gram, çeyrek, yarım, tam, cumhuriyet, ons) map through one table; unknown types are ignored and logged without user data.
- Money math in integer minor units or a decimal-safe approach; round only for display with `tr-TR` formatting.
- Fetches must time out quickly and validate the upstream shape; an incomplete snapshot (missing gold items) never replaces the last complete one.
Test: parser unit tests, mocked upstream failure, slow network, and a real device check of the rates screen. Report source endpoints (no keys), cache policy and test evidence.
