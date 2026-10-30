# Vintorex Digital Solutions — Web App

Storefront, customer portal and admin CRM for Vintorex Digital Solutions (Coimbatore).
It is a single-page app in `dist/` that also runs on static hosting (`.openai/hosting.json` serves `dist`), where checkout stays in demo mode. Real Razorpay payments need the small Node server in `server/` (see **Payments** below). The only build step generates the static blog pages (see **Blog** below).

## Run locally

```bash
npm start
```

This runs `server/index.mjs` (Node 18 or newer, no dependencies), which serves `dist/`, the payment API and the chat assistant. Open http://localhost:5173. With Razorpay keys in `.env`, checkout takes real payments, so use test keys locally (see **Payments**). ES modules and `crypto.subtle` need `http://localhost` or HTTPS, not `file://`.

Demo accounts (also shown on the sign-in page):

| Role | Email | Password |
|---|---|---|
| Admin | admin@vintorex.com | admin123 |
| Customer | demo@vintorex.com | demo123 |

Admin → Settings → **Reset demo data** restores the seed data.

## What's inside

- **Storefront** (`js/public.js`): home, 21 services with 3 packages each, pricing with memberships and a market comparison, shop (digital downloads and add-ons), cart with coupons, member discounts and GST, checkout, GST invoice, and lead forms (contact, free audit, service quote).
- **Customer dashboard** (`js/account.js`): plan upgrade, pause and cancel, monthly add-ons, project progress, downloads, invoices, support tickets, profile.
- **Admin / CRM** (`js/admin.js`): KPIs (revenue, MRR, win rate), lead list with scoring, filters and CSV export, drag-and-drop pipeline, lead notes and follow-ups, lead → customer conversion, customers, orders (status and progress), subscriptions, price editor for services, plans, add-ons, downloads and coupons, support inbox, business and GST settings.
- **Service catalog** (`js/services.js` and `js/ai-services.js` for the AI & Automation category): for each of the 21 services, the overview, ideal customers, 3 packages, every work item per package, exclusions, delivery process, a percentage cost split per package, and named competitor prices with source links. There are also 46 add-ons, each tagged with the services it applies to. After editing, run the check below, and bump `CATALOG_VERSION` in `js/data.js` so browsers with saved data pick up the new catalog.
- **Competitor analysis** (`#/compare`): all services against named competitors and market ranges. Each service page also has its own competitor table.
- **Milestone payments**: one-time projects of ₹10,000 or more can be paid 40% / 40% / 20%. Customers pay later instalments from their dashboard, and admins can record offline payments from Orders.
- **Blog** (`/blog/`): 42 evergreen guides, two per service, published as static HTML pages so search engines can index them. See below.
- **Policies** (`/terms/`, `/privacy-policy/`, `/refund-policy/`, `/shipping-policy/`): static pages built from `js/policies.js` by `npm run build:blog`, linked from the footer and checkout. Payment gateways such as Razorpay check for these pages.
- **Chat assistant** (`js/chat.js`, `server/chat.mjs`): an AI assistant on every page that answers from the site's own content and cites it, free on Cloudflare Workers AI. See below.
- **Plans and other settings**: `js/data.js`.

## Blog

Guide content lives in `dist/js/blog/`, in one file per category (`build.js`, `grow.js`, `brand.js`, `tech.js`, `ai.js`). Articles use a small Markdown subset (see the comment in `js/blog/index.js`). They deliberately avoid prices, years and tool-specific details so they stay accurate.

After adding or editing a guide, regenerate the static pages:

```bash
npm run build:blog
```

The command writes `dist/blog/index.html`, one `dist/blog/<slug>/index.html` per guide, `dist/sitemap.xml` and `dist/robots.txt`. It also refreshes the canonical link and LocalBusiness structured data (address, map pin, Google profile) in `dist/index.html`. Those details come from `BUSINESS` in `js/data.js`, so rebuild after changing them. Each page has a canonical URL, Open Graph tags and BlogPosting, FAQPage and BreadcrumbList structured data. The build stops with an error if a service has fewer than two guides or a link points at an unknown service. Commit the generated files, since hosting serves `dist/` as-is.

Canonical and sitemap URLs default to `https://vintorex.com`. If the app is served from another domain, rebuild with:

```bash
SITE_URL=https://your-domain.com npm run build:blog
```

The app links to these pages (service pages, home page, header and footer), and old `#/blog` links redirect to them. Page markup shared with the app lives in `js/chrome.js` (header and footer) and `js/blog/render.js` (cards and articles).

Content check (split columns sum to 100, links and references resolve, every service has two guides):

```bash
npm run check
```

## Payments

Checkout uses Razorpay when the site runs on `server/index.mjs`. When the app can't reach the server (static hosting, or `python3 -m http.server`), it falls back to demo mode and simulates payments.

The server reads these from the host's environment or from `.env` at the repo root (see `.env.example`):

| Variable | What it is |
|---|---|
| `RAZORPAY_KEY_ID` | Public key id (`rzp_live_…` or `rzp_test_…`). Also shown in `RAZORPAY` in `js/data.js`. |
| `RAZORPAY_KEY_SECRET` | Key secret. Server only: never put it in `dist/` or commit it. |
| `PAYMENT_TOKEN_SECRET` | Signs the membership and instalment tokens. Keep the same value when you rotate the Razorpay secret. |
| `PORT` | Port to listen on (default 5173). |

How a payment works:

1. The browser sends the cart to `POST /api/payments/order`. The server prices it from the shipped catalog in `js/data.js` (shared pricing code in `js/pricing.js`) and creates a Razorpay order. Prices in the browser are never trusted.
2. Razorpay Checkout opens for that order. Afterwards, `POST /api/payments/verify` checks the payment signature with the key secret before the order is recorded.
3. Accounts live in each browser, so the server keeps no database. Instead it returns signed tokens. A paid membership gets a token that unlocks the member discount on later orders. A milestone order gets a token that fixes the amounts of the remaining instalments.

Every payment appears in the Razorpay Dashboard with the customer's name, email, phone and items in its notes. Treat the Dashboard as the record of what was paid: orders in the admin panel are only those placed in the admin's own browser.

To test without real money, put `rzp_test_` keys from the Razorpay Dashboard (Test Mode) in `.env`, run `npm start`, and pay with Razorpay's test cards or UPI ID `success@razorpay`.

To go live, deploy the repo (not only `dist/`) to a Node host such as Hostinger Node.js hosting. Start it with `npm start` and set the variables above in the host's environment settings, not in a committed file.

## Chat assistant

Every page has an AI assistant (the sparkle button above the WhatsApp button). It answers from the site's own content: services, packages, work items, prices, add-ons, memberships, payments, FAQs, policies, the shop and all the guides. It cites the pages it used, replies in the visitor's language (English, Tamil, Hindi or Tanglish), says so when the site doesn't cover a question, and offers WhatsApp, a call or the contact form when a person should take over.

It runs on Cloudflare Workers AI inside the allowance every Cloudflare account gets free: 10,000 neurons a day, reset at 00:00 UTC.

| Job | Model | Cost in neurons |
|---|---|---|
| Writing answers | `@cf/google/gemma-4-26b-a4b-it`, falling back to `@cf/meta/llama-4-scout-17b-16e-instruct` if it fails | about 15–25 per answer |
| Search | `@cf/qwen/qwen3-embedding-0.6b` (multilingual) | about 0.03 per question; about 70 to embed the whole site |

The server stops calling the models once it has used `CHAT_DAILY_NEURONS` (default 9,000) in a day, which is roughly 350–600 answers. That keeps it free even on a Workers Paid account; on the Workers Free plan Cloudflare can't bill at all. A repeated first question, such as a suggestion button, is answered from memory for 6 hours. When the budget is spent, or without Cloudflare keys, the assistant switches to quick links: it lists the best-matching pages instead of writing an answer. Each visitor can send 20 messages every 10 minutes.

### Set up

1. In the [Cloudflare dashboard](https://dash.cloudflare.com/) (a free account is enough), open **Workers AI** and select **Use REST API**.
2. Select **Create a Workers AI API Token**, then **Create API Token**, and copy the token. Copy the **Account ID** shown on the same page.
3. Put both in `.env` (see `.env.example`) or in the host's environment settings: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. The token stays on the server; never put it in `dist/`.
4. Run `npm start`. The start-up line says `chat assistant on (Cloudflare Workers AI)`.

Optional settings: `CHAT_MODEL` and `CHAT_FALLBACK_MODEL` (any Workers AI chat model; set the fallback to an empty value to turn it off) and `CHAT_DAILY_NEURONS`.

### How it works

1. `server/knowledge.mjs` cuts the catalog, FAQs, guides and policies into about 350 short chunks, each with the page it comes from. The chunks are built from the same data as the pages, so prices in answers can't drift from the site.
2. `npm run build:chat` embeds the chunks and saves the vectors in `server/chat-vectors.json`. Only new or changed chunks are sent, so re-running after an edit costs a few neurons, and running it with nothing changed leaves git clean.
3. For each question, `server/chat.mjs` (`/api/chat`) ranks the chunks by meaning (the vectors) and by keywords, merges the two rankings and gives the best five to the model as numbered sources. Follow-up questions also search with the previous question, and questions asked on a service or guide page favour that service. The model must quote prices exactly and cite its sources, and the answer streams to the browser as it is written. For a site this size the search runs in memory in milliseconds, so no vector database is needed.
4. `dist/js/chat.js` is the widget. It asks `GET /api/chat` when the page loads and stays hidden where there is no server (static hosting), as checkout falls back to demo mode. The conversation is kept in the visitor's browser tab (sessionStorage), so it follows them between pages; the server keeps no chat logs.

After editing services, prices, guides or policies, run `npm run build:blog`, then `npm run build:chat`, and commit the results. If you forget `build:chat`, the server embeds the changed chunks when it starts and `npm run check` reminds you.

Questions and the matching site content are sent to Cloudflare Workers AI to write each answer, so consider mentioning the assistant in the privacy policy.

## SEO, GEO and AEO

`npm run build:blog` also publishes crawlable pages and machine-readable files, all generated from the catalog so prices never drift from the app:

- `/services/` (price list) and `/services/<id>/` for each service: answer-first summary, packages, work items, process, competitor prices, guides and FAQs. Structured data: `Service` with `Offer` per package, `FAQPage`, `BreadcrumbList`, `WebPage` with `speakable`.
- `/faq/`: site-wide answers (what we do, where, prices, GST, payments, instalments, free audit).
- `/llms.txt` and `/llms-full.txt`: plain-text map and full text of every service, price and FAQ for AI assistants.
- `robots.txt` names search and AI crawlers explicitly (and keeps `/api/` out), `sitemap.xml` has `lastmod` and priorities, and every page has `robots` directives, `en-IN` hreflang, geo tags and Open Graph tags. The home page has `LocalBusiness`/`ProfessionalService` with an offer catalogue, `WebSite`, and a no-JavaScript fallback with real links.

Copy and structured data live in `js/seo.js`. After re-checking prices or facts, update `REVIEWED` there, then rebuild. `npm run check` fails if a service lacks its page, FAQs, sitemap or `llms.txt` entry.

## Before going live

Data lives in each browser's `localStorage`. For production:

1. Move `js/db.js` behind a real API and database (for example Node + MySQL on Hostinger) with server-side authentication. Until then, admin price edits only affect the admin's browser. Customers see, and pay, the prices in `js/data.js`.
2. Send lead and order notifications by email or WhatsApp from the server.

## Brand assets

The shared header, footer, dashboards and invoices use `dist/images/vintorex-logo.png`, derived from the supplied transparent artwork preserved in `dist/images/vintorex-logo-original.png`. Browser icons live in `dist/icons/` and `dist/favicon.ico`; `dist/site.webmanifest` defines the Vintorex home-screen name and app icons. The 1200 × 630 sharing image is `dist/images/vintorex-social.png`.

Browser metadata is shared through `dist/js/brand.js`. Run `npm run build:blog` after changing branding so the home page and every static guide receive the same icons and metadata.
