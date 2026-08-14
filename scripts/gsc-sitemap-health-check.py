#!/usr/bin/env python3
"""GSC sitemap health check for Aurae.

Validates sitemap fetchability and checks every URL for indexability issues.
Outputs a shortlist of priority URLs to submit via GSC URL Inspection.
"""
import re
import ssl
import urllib.request
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

DOMAIN = 'https://www.aurae.asia'
SITEMAP = f'{DOMAIN}/sitemap-v3.xml'

# Discovery hubs to prioritize for manual indexing (daily quota ~10).
HUB_URLS = {
    f'{DOMAIN}/',
    f'{DOMAIN}/index.html?shop=all',
    f'{DOMAIN}/index.html?view=about',
    f'{DOMAIN}/contact.html',
    f'{DOMAIN}/faq.html',
    f'{DOMAIN}/blog.html',
}

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


GOOGLEBOT_UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'


def fetch(url, ua=None):
    req = urllib.request.Request(url, headers={'User-Agent': ua or GOOGLEBOT_UA})
    with urllib.request.urlopen(req, context=ctx, timeout=20) as r:
        return r.status, dict(r.headers), r.read().decode('utf-8', 'ignore')


def main():
    print('=== Sitemap fetchability ===')
    status, headers, body = fetch(SITEMAP, 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)')
    print(f'URL: {SITEMAP}')
    print(f'Status: {status}')
    print(f'Content-Type: {headers.get("Content-Type")}')
    print(f'Cache-Control: {headers.get("Cache-Control")}')
    for h in ('ETag', 'Last-Modified', 'Accept-Ranges', 'X-Robots-Tag'):
        print(f'{h}: {headers.get(h) or "(none)"}')

    try:
        root = ET.fromstring(body)
        urls = [loc.text for loc in root.iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
        print(f'\nValid XML: yes')
        print(f'URL count: {len(urls)}')
    except Exception as e:
        print(f'\nValid XML: no -> {e}')
        return

    print('\n=== Per-URL indexability check (sample / critical URLs) ===')
    # Start with hubs, then the rest.
    sorted_urls = sorted(urls, key=lambda u: (0 if u in HUB_URLS else 1, u))
    checked = []
    for url in sorted_urls:
        try:
            s, h, b = fetch(url)
            noindex = 'noindex' in b.lower() or 'noindex' in (h.get('X-Robots-Tag', '').lower())
            canon = re.search(r'<link[^>]*rel=["\']?canonical["\']?[^>]*href=["\']?([^"\' >]+)', b, re.I)
            canon_val = canon.group(1) if canon else '(none)'
            issue = []
            if s != 200:
                issue.append(f'status {s}')
            if noindex:
                issue.append('noindex')
            if canon_val != url and canon_val != '(none)':
                issue.append(f'canonical mismatch ({canon_val})')
            ok = not issue
            checked.append({
                'url': url,
                'status': s,
                'noindex': noindex,
                'canonical': canon_val,
                'ok': ok,
                'issues': '; '.join(issue) or '-'
            })
        except Exception as e:
            checked.append({'url': url, 'ok': False, 'issues': str(e)})

    ok_count = sum(1 for c in checked if c.get('ok'))
    print(f'OK: {ok_count}/{len(checked)}')
    for c in checked:
        mark = 'OK' if c.get('ok') else 'FAIL'
        print(f'{mark} {c["url"]} - {c.get("issues", "")}')

    print('\n=== Recommended priority URLs for GSC URL Inspection ===')
    priority = [c['url'] for c in checked if c.get('ok')][:10]
    for i, u in enumerate(priority, 1):
        print(f'{i}. {u}')


if __name__ == '__main__':
    main()
