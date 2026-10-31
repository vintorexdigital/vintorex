#!/usr/bin/env bash
# Runs on the server: pull latest main, rebuild static pages, restart the service.
set -euo pipefail
cd /home/ubuntu/vintorex
git pull --ff-only origin main
npm run build:blog
npm run check
sudo systemctl restart vintorex
sleep 2
curl -fsS -o /dev/null http://localhost:5173 && echo "deploy ok"
