#!/usr/bin/env bash
# Runs on the server after the tree matches origin/main: install, rebuild static pages, restart.
set -euo pipefail
cd /home/ubuntu/vintorex

# build:blog rewrites tracked HTML under dist/. Discard that dirt so the next deploy's
# git reset/pull never aborts, and so this run starts from a clean tree.
git restore --worktree --staged --source=HEAD -- dist/ 2>/dev/null || git checkout -- dist/
git clean -fd -- dist/

npm ci --omit=dev
npm run build:blog
npm run check
sh scripts/setup-youtube.sh
.venv/bin/yt-dlp --version
.venv/bin/ffmpeg -version >/dev/null
sudo systemctl restart vintorex
sleep 3
# Check the service itself, not only that something answers: an old copy of the server left running on the port
# answers too, while the new one fails to start (EADDRINUSE) and old code keeps serving.
if ! systemctl is-active --quiet vintorex; then
  echo "deploy FAILED: the vintorex service is not running" >&2
  journalctl -u vintorex -n 15 --no-pager >&2
  exit 1
fi
# Smoke the offer page and claim API — both must be live after deploy.
curl -fsS -o /dev/null http://localhost:5173/
curl -fsS -o /dev/null http://localhost:5173/offer
curl -fsS -X POST -H 'content-type: application/json' -d '{}' http://localhost:5173/api/offers/draw >/dev/null
echo "deploy ok"
