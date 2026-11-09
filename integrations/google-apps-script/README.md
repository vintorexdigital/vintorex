# Google Sheets integration

Vintorex keeps leads and offer claims in SQLite and can mirror them into a Google Sheet.

## Error 400: `policy_enforced` (Advanced Protection)

If Google shows **“Untitled project is not approved by Advanced Protection”** while authorizing Apps Script, the account (`vintorexdigital@gmail.com`) has Advanced Protection enabled. That program blocks unverified OAuth clients — including a new Apps Script project — so the web-app consent screen cannot complete.

**Use the service-account path below** (recommended). It never opens a Google sign-in screen.

Optional Apps Script path only works if you deploy the script from a Google account **without** Advanced Protection, then share the Sheet with your main account.

---

## Recommended: service account (bypasses Advanced Protection)

1. In [Google Cloud Console](https://console.cloud.google.com/) create (or pick) a project.
2. Enable **Google Sheets API**.
3. **IAM & Admin → Service accounts → Create**. Download a JSON key.
4. Create a Google Sheet, rename the first tab to **Inbox**.
5. Share the Sheet with the service account email (`…@….iam.gserviceaccount.com`) as **Editor**.
6. Copy the spreadsheet ID from the URL (`/d/<SPREADSHEET_ID>/edit`).
7. On the server `.env`:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=<id from the Sheet URL>
GOOGLE_SHEETS_TAB=Inbox
# Either paste the JSON on one line, or point at a private file outside the repo:
GOOGLE_SERVICE_ACCOUNT_FILE=/home/ubuntu/secrets/vintorex-sheets.json
# GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

8. Restart the Node service. Leads and offer claims append to **Inbox** automatically.

Never commit the JSON key. Keep it in `/home/ubuntu/secrets/` (or similar) with mode `600`.

---

## Alternative: Apps Script web app (no Advanced Protection)

Only if the Google account that owns the script is **not** enrolled in Advanced Protection:

1. Create a Sheet, tab name **Inbox**.
2. Extensions → Apps Script. Paste [`Code.gs`](./Code.gs).
3. Set `WEBAPP_SECRET` to the same value as `GOOGLE_SHEETS_SECRET` in `.env`.
4. Deploy → Web app → Execute as **Me**, Who has access **Anyone**.
5. Set on the server:

```bash
GOOGLE_SHEETS_WEBAPP_URL=https://script.google.com/macros/s/…/exec
GOOGLE_SHEETS_SECRET=<same hex as WEBAPP_SECRET>
```

After script edits: Manage deployments → Edit → New version.

### Smoke test (Apps Script)

```bash
SECRET=your_hex
BODY='{"event":"lead.created","at":"2026-11-07T00:00:00.000Z","payload":{"id":"l_test","name":"Test","email":"test@example.com","phone":"","service":"web-design","source":"manual","message":"ping"}}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')
curl -sS -X POST "$GOOGLE_SHEETS_WEBAPP_URL" \
  -H 'content-type: application/json' \
  -H "x-vintorex-signature: $SIG" \
  -d "$BODY"
```

---

## What gets written

| Event | When |
|---|---|
| `lead` | Contact / MCP / campaign queue |
| `offer` | Offer claim saved |

The server prefers the **service account** when `GOOGLE_SHEETS_SPREADSHEET_ID` + key are set; otherwise it uses the Apps Script web app URL.
