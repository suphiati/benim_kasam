# API
GET /api/rates (api/rates.ts on Vercel, fra1). Public, CORS *, OPTIONS returns 204. No auth and no user data.

- 200: flat map of currency and metal keys plus _meta {sources, failures, divergences, timestamp, fetchedAt}. If live gold data is incomplete, it serves the Upstash last-good snapshot with _meta.degraded true and "last-good" in sources.
- 503: gold incomplete and no last-good snapshot. 500: fetch failure. Both carry sources and failures.
- Cache-Control: s-maxage=60, stale-while-revalidate=120, stale-if-error=86400.
- Upstreams: finans.truncgil.com, api.genelpara.com, api.exchangerate-api.com. UPSTASH_REDIS_REST_URL/TOKEN enable the last-good store.

Client: src/services/rateService.ts and apiMappers.ts; base URL from VITE_API_BASE_URL, falling back to Truncgil directly when unset.
