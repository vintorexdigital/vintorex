#!/usr/bin/env python3
import urllib.request
import ssl
import sys
from pathlib import Path
from PIL import Image

DEST_DIR = Path('dist/images/blog')
DEST_DIR.mkdir(parents=True, exist_ok=True)

# Curated, photorealistic high-resolution photography mappings for the remaining blog posts
PHOTOS = {
    'local-seo-guide': 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1600&h=900&q=85',
    'social-media-content-plan': 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=1600&h=900&q=85',
    'ad-performance-metrics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&h=900&q=85',
    'email-automations-to-set-up-first': 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?auto=format&fit=crop&w=1600&h=900&q=85',
    'email-deliverability-basics': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&h=900&q=85',
    'brief-a-designer-for-a-logo': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&h=900&q=85',
    'write-blog-posts-that-rank': 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1600&h=900&q=85',
    'topic-clusters-content-strategy': 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1600&h=900&q=85',
    'short-form-video-anatomy': 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=1600&h=900&q=85',
    '3d-renders-for-industrial-products': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&h=900&q=85',
    'b2b-product-catalogue-design': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1600&h=900&q=85',
    'shared-hosting-vps-or-cloud': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&h=900&q=85',
    'backups-and-disaster-recovery': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&h=900&q=85',
    'marketing-dashboard-numbers': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&h=900&q=85',
    'website-maintenance-checklist': 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1600&h=900&q=85',
    'wordpress-security-habits': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1600&h=900&q=85',
    'ai-chatbot-vs-rule-based-chatbot': 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=1600&h=900&q=85',
    'customer-facing-ai-assistant-launch-checklist': 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&h=900&q=85',
    'when-ai-voice-agents-make-sense': 'https://images.unsplash.com/photo-1590650516494-0c8e4a4dd67e?auto=format&fit=crop&w=1600&h=900&q=85',
    'designing-phone-conversations-for-ai-agents': 'https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1600&h=900&q=85',
    'which-business-processes-to-automate-first': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1600&h=900&q=85',
    'making-automations-reliable': 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&h=900&q=85',
    'human-in-the-loop-ai-content-workflow': 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1600&h=900&q=85',
    'teach-ai-your-brand-voice': 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&h=900&q=85',
    'how-ai-assistants-answer-from-your-documents': 'https://images.unsplash.com/photo-1507842229458-7729b5f92ff4?auto=format&fit=crop&w=1600&h=900&q=85',
    'prepare-documents-for-ai-assistant': 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=1600&h=900&q=85',
    'ai-adoption-roadmap-for-small-business': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&h=900&q=85',
    'simple-ai-usage-policy-for-your-team': 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&h=900&q=85',
    'how-ai-search-answers-are-built': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&h=900&q=85',
    'make-content-easy-for-ai-to-cite': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&h=900&q=85',
}

# Verify TLS certificates; use certifi's bundle when Python's own store is missing (common on macOS).
try:
    import certifi
    ctx = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    ctx = ssl.create_default_context()
headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

for slug, url in PHOTOS.items():
    target = DEST_DIR / f"{slug}.jpg"
    if target.exists() and target.stat().st_size > 50000:
        print(f"Already exists: {slug}")
        continue
    print(f"Downloading {slug}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        data = urllib.request.urlopen(req, context=ctx, timeout=15).read()
        target.write_bytes(data)
        im = Image.open(target)
        print(f"✓ Saved {slug} ({im.size[0]}x{im.size[1]}, {len(data)//1024} KB)")
    except Exception as e:
        print(f"✗ Failed {slug}: {e}", file=sys.stderr)

print("Finished processing all photos!")
