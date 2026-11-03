#!/usr/bin/env bash
# Runs on the server: pull latest main, rebuild static pages, restart the service.
set -euo pipefail
cd /home/ubuntu/vintorex
git pull --ff-only origin main
npm run build:blog
npm run check
sudo systemctl restart vintorex
sleep 3
# Check the service itself, not only that something answers: an old copy of the server left running on the port
# answers too, while the new one fails to start (EADDRINUSE) and old code keeps serving.
if ! systemctl is-active --quiet vintorex; then
  echo "deploy FAILED: the vintorex service is not running" >&2
  journalctl -u vintorex -n 15 --no-pager >&2
  exit 1
fi
curl -fsS -o /dev/null http://localhost:5173 && echo "deploy ok"
