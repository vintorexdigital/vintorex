#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if [ -f /etc/debian_version ] && ! python3 -c "import ensurepip" 2>/dev/null; then
  sudo apt-get update
  sudo apt-get install -y python3-venv
fi
python3 -m venv .venv
.venv/bin/python -m pip install 'yt-dlp[default]==2026.10.26' 'imageio-ffmpeg==0.8.1'
ln -sf "$(.venv/bin/python -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())')" .venv/bin/ffmpeg
