---
name: bk-rates
description: BenimKasam currency/gold rate pipeline - api/rates.ts parsing, Turkish number formats, caching, history (fxHistoryService) and stale-rate handling.
---
Read api/rates.ts, src/services/rateService.ts, fxHistoryService.ts and apiMappers.ts first.

- Upstream sources return Turkish formatted numbers ("1.234,56") or plain numbers; parse with the existing parseNum helper and unit-test both formats, empty values and dashes. Never use parseFloat directly on Turkish strings.
- Buying vs Selling: holdings valuation uses one documented side consistently (state which in UI); never mix sides within a total.
- Cache responses (CDN cache headers on the Vercel function, client cache with timestamp). Show "last updated" and a stale indicator when data is older than the threshold or offline; never show zero as a rate on failure.
- Gold types (gram, çeyrek, yarım, tam, cumhuriyet, ons) map through one table; unknown types are ignored and logged without user data.
- Money math in integer minor units or a decimal-safe approach; round only for display with `tr-TR` formatting.
- The function must time out quickly, validate upstream shape, and return a typed error the client can show.
Test: parser unit tests, mocked upstream failure, slow network, and a real device check of the rates screen. Report source endpoints (no keys), cache policy and test evidence.
