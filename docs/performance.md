# Responsiveness and loading validation

Validated locally on 5 November 2026 using isolated SQLite databases and headless Chrome.

## Changes and measured payloads

- Initial app module graph: 339,888 → approximately 231,720 uncompressed bytes (32% reduction). Shared settings and competitor links no longer import the service seed catalog. Footer links no longer import full policy documents. Server/admin seed exports remain compatible.
- Initial anonymous `/api/auth/session` response: 257,480 → 89,378 transferred bytes with gzip (65% reduction for the seeded test database). JSON compression streams asynchronously and preserves `Cache-Control: no-store` and session cookies.
- Decorative canvas remains static on screens at or below 900px, coarse pointers, reduced-motion preferences, and supported data-saving connections. Desktop animation remains available and pauses when the page is hidden.
- Pointer highlight layout reads/writes are limited to one update per animation frame.
- Grid children, long account values, modal controls, and narrow dashboard cards now fit their containers. Mobile inputs use a 16px font to avoid focus zoom.

## Verification

- 33 automated tests pass, including new compression/HTTP semantics and initial-import regression checks.
- Content checks, blog generation and 44 SEO checks pass.
- 21 public routes at 360, 390, 768, and 1440px: 84 combinations, no document-level horizontal overflow or uncaught JavaScript exceptions.
- 11 admin and 8 customer routes at 360, 768, and 1440px: 57 combinations, no document-level horizontal overflow, missing dashboard shells, error screens, or uncaught JavaScript exceptions.
- Mobile homepage screenshot inspected for layout.

These are local payload and layout checks, not production Core Web Vitals or a guarantee of zero lag. Production hosting latency, slow-network performance, populated account datasets, external integrations and real-device interaction timings still need deployment-side measurement. Payment and external audit operations were not executed during browser checks.

Maintain lightweight imports from `dist/js/site-data.js`; `dist/js/data.js` is the full seed entry point for server storage, generators and admin record templates. Pass services explicitly to `siteFooter`.
