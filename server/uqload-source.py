"""Read the player configuration without executing any remote JavaScript."""
import re
import sys
from yt_dlp.utils import decode_packed_codes

for script in re.findall(r'<script\b[^>]*>(.*?)</script>', sys.stdin.read(), re.S | re.I):
    if 'eval(function(p,a,c,k' in script:
        script = decode_packed_codes(script)
    source = re.search(r'\bsources\s*:\s*\[\s*\{\s*file\s*:\s*"(https://[^"]+)"', script)
    if source:
        print(source[1])
        break
