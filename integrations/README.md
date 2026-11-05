# Vintorex marketing integration

Vintorex stores the catalogue, enquiries and orders. n8n runs the workflows. OpenClaw and Paperclip are MCP clients of both.

```
Site / OpenClaw / Paperclip
        │  MCP  POST /api/mcp
        ▼
     Vintorex
        │  signed webhook
        ▼
       n8n
        ├─ lead-intake          enabled, no spend
        ├─ google-ads           Google Ads call disabled
        ├─ meta-business        Meta Business Manager call disabled
        └─ social-publish       Facebook, Instagram, YouTube, X, LinkedIn, TikTok, WhatsApp disabled
```

Import `integrations/n8n/*.json` into n8n and enable each workflow for instance-level MCP. Point OpenClaw at `integrations/openclaw.mcp.json` and Paperclip at `integrations/paperclip.connectors.json`.

Set `INTEGRATIONS_API_KEY`, `N8N_WEBHOOK_BASE` and `N8N_WEBHOOK_SECRET` in the environment, not in git. Campaign tools refuse to queue until `approved` is true, and even then they only notify n8n. The HTTP nodes that would spend or publish ship disabled.
