# Vintorex Digital Solutions — Web App

Storefront, customer portal and admin CRM for Vintorex Digital Solutions (Coimbatore).
It is a static single-page app in `dist/`, so it deploys the same way as the current site (`.openai/hosting.json` serves `dist`). The only build step generates the static blog pages (see **Blog** below).

## Run locally

```bash
python3 -m http.server 5173 --directory dist
```

Open http://localhost:5173. ES modules and `crypto.subtle` need `http://localhost` or HTTPS, not `file://`.

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

## Before going live

Data lives in each browser's `localStorage` and payments are simulated. For production:

1. Move `js/db.js` behind a real API and database (for example Node + MySQL on Hostinger) with server-side authentication.
2. Create Razorpay orders and verify payment signatures on the server. Never put the key secret in the browser.
3. Send lead and order notifications by email or WhatsApp from the server.
