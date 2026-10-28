# Vintorex Digital Solutions — Web App

Storefront, customer portal and admin CRM for Vintorex Digital Solutions (Coimbatore).
It is a static single-page app in `dist/` (no build step), so it deploys the same way as the current site (`.openai/hosting.json` serves `dist`).

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

- **Storefront** (`js/public.js`): home, 14 services with 3 packages each, pricing with memberships and a market comparison, shop (digital downloads and add-ons), cart with coupons, member discounts and GST, checkout, GST invoice, and lead forms (contact, free audit, service quote).
- **Customer dashboard** (`js/account.js`): plan upgrade, pause and cancel, monthly add-ons, project progress, downloads, invoices, support tickets, profile.
- **Admin / CRM** (`js/admin.js`): KPIs (revenue, MRR, win rate), lead list with scoring, filters and CSV export, drag-and-drop pipeline, lead notes and follow-ups, lead → customer conversion, customers, orders (status and progress), subscriptions, price editor for services, plans, add-ons, downloads and coupons, support inbox, business and GST settings.
- **Service catalog** (`js/services.js`): for each of the 14 services, the overview, ideal customers, 3 packages, every work item per package, exclusions, delivery process, a percentage cost split per package, and named competitor prices with source links. There are also 31 add-ons, each tagged with the services it applies to. After editing, run the check below, and bump `CATALOG_VERSION` in `js/data.js` so browsers with saved data pick up the new catalog.
- **Competitor analysis** (`#/compare`): all services against named competitors and market ranges. Each service page also has its own competitor table.
- **Milestone payments**: one-time projects of ₹10,000 or more can be paid 40% / 40% / 20%. Customers pay later instalments from their dashboard, and admins can record offline payments from Orders.
- **Plans and other settings**: `js/data.js`.

Catalog check (split columns sum to 100, references resolve):

```bash
node -e "import('./dist/js/data.js').then(({SERVICES:S})=>S.forEach(s=>[1,2,3].forEach(t=>{const n=s.split.reduce((a,r)=>a+r[t],0);if(n!==100)console.log(s.id,t,n)})))"
```

## Before going live

Data lives in each browser's `localStorage` and payments are simulated. For production:

1. Move `js/db.js` behind a real API and database (for example Node + MySQL on Hostinger) with server-side authentication.
2. Create Razorpay orders and verify payment signatures on the server. Never put the key secret in the browser.
3. Send lead and order notifications by email or WhatsApp from the server.
