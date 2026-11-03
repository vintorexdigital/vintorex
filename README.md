# Vintorex Digital Solutions — Web App

Storefront, customer portal and admin CRM for Vintorex Digital Solutions (Coimbatore).
It is a single-page app in `dist/` that also runs on static hosting (`.openai/hosting.json` serves `dist`), where checkout stays in demo mode. Real Razorpay payments need the small Node server in `server/` (see **Payments** below). The only build step generates the static blog pages (see **Blog** below).

## Run locally

```bash
npm start
```

This runs `server/index.mjs` (Node 18 or newer, no dependencies), which serves `dist/`, the payment API and the chat assistant. Open http://localhost:5173. With Razorpay keys in `.env`, checkout takes real payments, so use test keys locally (see **Payments**). ES modules and `crypto.subtle` need `http://localhost` or HTTPS, not `file://`.

Admin → Settings → **Reset demo data** restores the seed data.

## What's inside

- **Storefront** (`js/public.js`): home, 21 services with 3 packages each, pricing with memberships and a market comparison, shop (digital downloads and add-ons), cart with coupons, member discounts and GST, checkout, GST invoice, and lead forms (contact, free audit, service quote).
- **Customer dashboard** (`js/account.js`): plan upgrade, pause and cancel, monthly add-ons, project progress, downloads, invoices, support tickets, profile.
- **Admin / CRM** (`js/admin.js`): KPIs (revenue, MRR, win rate), lead list with scoring, filters and CSV export, drag-and-drop pipeline, lead notes and follow-ups, lead → customer conversion, customers, orders (status and progress), subscriptions, price editor for services, plans, add-ons, downloads and coupons, support inbox, business and GST settings.
- **Service catalog** (`js/services.js` and `js/ai-services.js` for the AI & Automation category): for each of the 21 services, the overview, ideal customers, 3 packages, every work item per package, exclusions, delivery process, a percentage cost split per package, and named competitor prices with source links. There are also 46 add-ons, each tagged with the services it applies to. After editing, run the check below, and bump `CATALOG_VERSION` in `js/data.js` so browsers with saved data pick up the new catalog.
- **Competitor analysis** (`/compare`): all services against named competitors and market ranges. Each service page also has its own competitor table.
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

The app links to these pages (service pages, home page, header and footer). Page markup shared with the app lives in `js/chrome.js` (header and footer) and `js/blog/render.js` (cards and articles).

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

## WhatsApp

`server/whatsapp/` is the WhatsApp Business **Cloud API** (Graph API v26.0) inside the same server, with no extra dependencies. It stays off until its variables are set (see `.env.example`); the start-up line says what is on. Run its tests with `npm test`.

| File | Job |
|---|---|
| `client.mjs` | Every outbound call: text, templates, media, buttons, lists, CTA links, location, reactions, templates, media upload and download, phone health. Also the partner calls (below). `phoneNumberId` and `wabaId` can point at a client's number. |
| `webhook.mjs` | Checks `X-Hub-Signature-256`, flattens Meta's payload into `message`, `status`, `other` and `error` events on a bus, and drops repeat deliveries. |
| `handlers.mjs` | Our own logic. The sample menu bot (hi → buttons → list or link) only runs with `WHATSAPP_BOT=on`, and only on our own number. |
| `routes.mjs` | The HTTP routes under `/api/whatsapp/`. |

**Routes.** `GET /api/whatsapp` reports what is configured. `GET|POST /api/whatsapp/webhook` is Meta's callback. Everything else needs the header `x-api-key: <WHATSAPP_API_KEY>`: `POST /send/{text,template,media,buttons,list,cta,location}`, `GET|POST|DELETE /templates`, `GET /phone`, `POST /partner/onboard`, `POST /partner/credit-line`. Example:

```bash
curl -X POST https://vintorex.com/api/whatsapp/send/template \
  -H "x-api-key: $WHATSAPP_API_KEY" -H "Content-Type: application/json" \
  -d '{"to":"9876543210","name":"booking_confirmation","language":"en","bodyParams":["Ravi","12 Nov 2026","BK-1042"]}'
```

### Setting it up in Meta

The assets, in order (Step numbers are Meta's onboarding steps for Tech Providers):

1. **Meta app** on developers.facebook.com with the WhatsApp product, linked to the Vintorex business portfolio. Copy the **App ID** and **App secret** into `META_APP_ID` and `META_APP_SECRET`.
2. **Test WABA (Step 1).** API Setup gives a test number, its Phone number ID and WABA ID. The temporary token lasts about 24 hours; use it only to see a first message arrive.
3. **Webhooks (Step 2).** Callback URL `https://vintorex.com/api/whatsapp/webhook`, Verify token = `WEBHOOK_VERIFY_TOKEN`. Subscribe to `messages`, and to `message_template_status_update`, `phone_number_quality_update` and `account_update`. The server must be running with those variables set before you click Verify.
4. **System user (Step 2).** Business Settings → Users → System users → Add (Admin). Assign the app and the WABA with full control, then generate a token that never expires with `whatsapp_business_messaging` and `whatsapp_business_management` → `WHATSAPP_TOKEN`.
5. **Business verification (Step 3).** Business Settings → Security Centre. It raises messaging limits and is required to onboard clients.
6. **Real number, templates, payment method.** Add the production number (it must not be active in the WhatsApp apps), then a payment method in WhatsApp Manager, then message templates. Anything we send first needs an approved template. Free-form messages work only within 24 hours of the customer's last message (error 131047 otherwise).
7. **Privacy Policy URL** in App settings → Basic, then switch the app to Live. Real customers' webhooks arrive only when it is live.

### Onboarding clients (Become a Partner)

Once the app is a Tech Provider or Solution Partner, clients connect their own WhatsApp Business Account through **Embedded Signup** on `/connect-whatsapp`.

1. In the Meta app, create a **Facebook Login for Business** configuration with the WhatsApp Embedded Signup product and copy its ID into `WHATSAPP_SIGNUP_CONFIG_ID`. Add `vintorex.com` to the app's Allowed domains and Valid OAuth redirect URIs (HTTPS only). The page uses signup `version: 'v5'`.
2. Make an invite for a client. It is a signed link that expires (7 days by default, at most 30) and names them; rotating `WHATSAPP_API_KEY` voids all open invites:

   ```bash
   curl -X POST https://vintorex.com/api/whatsapp/partner/invite \
     -H "x-api-key: $WHATSAPP_API_KEY" -H "Content-Type: application/json" \
     -d '{"name":"Spark Dental","days":7}'
   ```
3. Send the client the returned `url`. They press **Connect with Facebook**, pick or create their WhatsApp number in Meta's popup and finish. Meta hands the page a **code that lasts only 30 seconds** plus the client's `waba_id` and `phone_number_id`; the page posts them to `POST /api/whatsapp/signup`, which checks the invite and onboards the client.

Onboarding (`POST /api/whatsapp/partner/onboard` does the same with the API key) exchanges the code for the client's token, subscribes our app to their WABA's webhooks, registers the number for Cloud API with a random 6-digit two-step PIN that is not stored (set a new one in WhatsApp Manager if needed) and, if `WHATSAPP_CREDIT_LINE_ID` is set, shares our credit line so Meta bills us rather than the client (INR, USD, EUR, GBP, AUD or IDR only; it can't be changed later). Without a credit line the client adds their own payment method in WhatsApp Manager. The client's token is used for that onboarding only and is not stored: afterwards the System User sends for them by passing `wabaId` or `phoneNumberId` on any call, as long as the client shared the WABA with us. Our webhook receives their events with `wabaId` and `phoneNumberId` set, so handlers can tell accounts apart. Onboarding is logged on the server (`WhatsApp client "…" onboarded`), but client records are not kept: save the ids from the log or from `GET /api/whatsapp` calls you make.

An invite can be reused until it expires, though each Meta code works once. Not built: moving numbers or templates between partners (client migration), and a client list.

## Firebase

Project `vintorex-digital-solutions-024`, with Google Analytics (`G-TMWF3S1YEZ`) switched on for the live site only (never on localhost). The site has no bundler, so `scripts/firebase-entry.mjs` holds the config and initialisation, and `npm run build:firebase` bundles it with the `firebase` package into `dist/js/firebase.js`, which `js/main.js` loads after the page is up. Commit that file; the server does not need `node_modules`. The web config is public by design, so restrict the API key to vintorex.com in Google Cloud Console → Credentials, and keep Firebase security in its rules. The app page's CSP allows Google Tag Manager, Analytics and Firebase for this. Only the app pages load it; the static guides and service pages do not. Analytics sets cookies, so mention it in the privacy policy (`js/policies.js`, then `npm run build:blog`).

## URLs

Every page has a real address, so pages can be shared, bookmarked and indexed: `/contact`, `/pricing`, `/shop`, `/cart`, `/login`, `/account/orders`, `/admin/leads/<id>`. Pages written in HTML (`/services/`, `/services/<id>/`, `/blog/…`, `/faq/`, the policies) are static files; the interactive package picker for a service lives at `/services/<id>/packages`.

- `js/routes.js` lists the app's pages once. The server uses it to answer each with the app shell (`index.html`), and the browser's router (`js/router.js`, `js/main.js`) uses it to match them. Add a page by adding its pattern there and its view in `js/main.js`.
- Clicks on links to app pages change the view without a reload (History API); everything else loads normally. Use `navigate('/path')` from `js/router.js` in code, never `location.hash`.
- The server sets each page's canonical address, title, description and Open Graph tags in the raw HTML, answers unknown addresses with a real 404, and marks sign-in, cart, checkout, orders and dashboards `noindex` (also in `robots.txt`). Trailing slashes are redirected, so app pages have none (`/contact`) and static pages always do (`/blog/`).
- Old links of the form `/#/contact` (and `/#/services/seo`, `/#/blog/<slug>`) still work: the app redirects them to the real address once.
- Hosting must send every unknown path to `server/index.mjs` (as the Node server and a reverse proxy do), not serve `dist/` as plain files.

## SEO, GEO and AEO

`npm run build:blog` also publishes crawlable pages and machine-readable files, all generated from the catalog so prices never drift from the app:

- `/services/` (price list) and `/services/<id>/` for each service: answer-first summary, packages, work items, process, competitor prices, guides and FAQs. Structured data: `Service` with `Offer` per package, `FAQPage`, `BreadcrumbList`, `WebPage` with `speakable`.
- `/faq/`: site-wide answers (what we do, where, prices, GST, payments, instalments, free audit).
- `/llms.txt` and `/llms-full.txt`: plain-text map and full text of every service, price and FAQ for AI assistants.
- `robots.txt` names search and AI crawlers explicitly (and keeps `/api/` and the private pages out), `sitemap.xml` has `lastmod` and priorities, and every page has `robots` directives, `en-IN` hreflang, geo tags and Open Graph tags. The home page has `LocalBusiness`/`ProfessionalService` with an offer catalogue, `WebSite`, and a no-JavaScript fallback with real links.

Copy and structured data live in `js/seo.js`. After re-checking prices or facts, update `REVIEWED` there, then rebuild. `npm run check` fails if a service lacks its page, FAQs, sitemap or `llms.txt` entry.

## Before going live

Data lives in each browser's `localStorage`. For production:

1. Move `js/db.js` behind a real API and database (for example Node + MySQL on Hostinger) with server-side authentication. Until then, admin price edits only affect the admin's browser. Customers see, and pay, the prices in `js/data.js`.
2. Send lead and order notifications by email or WhatsApp from the server.

## Brand assets

The header, footer, dashboards and invoices show the emblem as `dist/images/vintorex-emblem-144.webp` and `-288.webp` (trimmed, transparent, no block behind it, sized from the wordmark width). `vintorex-logo.png` is the same artwork on a square canvas for schema.org and checkout. Both come from the supplied transparent artwork preserved in `dist/images/vintorex-logo-original.png`. Browser icons live in `dist/icons/` and `dist/favicon.ico`; `dist/site.webmanifest` defines the Vintorex home-screen name and app icons. The 1200 × 630 sharing image is `dist/images/vintorex-social.png`.

Next to the logo, the header, footer and dashboards show the wordmark: "Vintorex" in Gladiola and "DIGITAL SOLUTIONS" in Montaser Arabic, with Canva's echo effect. Canva doesn't export its fonts, so the site shows the supplied artwork (`dist/images/vintorex-wordmark-original.png`) rather than web fonts. `scripts/build-wordmark.py` cuts it into `vintorex-name-*.webp` and `vintorex-tagline-*.webp`, plus `-dark` versions for the footer and the admin sidebar; `brandLogo()` in `js/chrome.js` writes the markup. After replacing the artwork, check the crop boxes in the script, then run `python3 scripts/build-wordmark.py` (needs Pillow and NumPy) and `npm run build:blog`.

Browser metadata is shared through `dist/js/brand.js`. Run `npm run build:blog` after changing branding so the home page and every static guide receive the same icons and metadata.

## Typography

`dist/css/typography.css` defines the shared Inter type scale, heading weights, reading widths, form text and dashboard styles. It loads after `app.css` on the app and all generated pages. The variable Latin WOFF2 font is hosted in `dist/fonts/`, with its SIL Open Font License in `Inter-OFL.txt`; other scripts and unsupported characters use the native system fallbacks. No external font request is needed. Run `npm run build:blog` after updating page-level stylesheet links.
