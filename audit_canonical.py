import urllib.request, urllib.error, ssl, re, json
from urllib.parse import urljoin, urlparse

BASE = "https://www.aurae.asia"
BOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def fetch(url, follow=False, maxr=6):
    last = None
    cur = url
    chain = []
    for _ in range(maxr):
        req = urllib.request.Request(cur, headers={"User-Agent": BOT_UA})
        try:
            resp = urllib.request.urlopen(req, timeout=25, context=ctx)
            body = resp.read().decode("utf-8", "replace")
            status = resp.status
            headers = dict(resp.getheaders())
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            status = e.code
            headers = dict(e.headers)
        except Exception as e:
            last = {"url": cur, "status": 000, "headers": {}, "body": "", "err": str(e)}
            chain.append((cur, 000))
            break
        last = {"url": cur, "status": status, "headers": headers, "body": body}
        chain.append((cur, status))
        if not follow or status not in (301, 302, 303, 307, 308):
            break
        loc = headers.get("Location") or headers.get("location")
        if not loc:
            break
        cur = urljoin(cur, loc)
    return last, chain

def canon(body):
    m = re.search(r'<link[^>]+rel=["\']?canonical["\']?[^>]+href=["\']([^"\']+)["\']', body, re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']?canonical["\']?', body, re.I)
    return m.group(1) if m else None

def robots(body):
    m = re.search(r'<meta[^>]+name=["\']?robots["\']?[^>]+content=["\']([^"\']+)["\']', body, re.I)
    return m.group(1) if m else None

def title(body):
    m = re.search(r'<title>([^<]*)</title>', body, re.I)
    return (m.group(1)[:60] if m else None)

print("="*120)
print("PART 1 — Every sitemap URL must self-reference its canonical (status 200, canonical == URL)")
print("="*120)
with open("audit_sitemap.xml", encoding="utf-8") as f:
    sm = f.read()
urls = re.findall(r'<loc>([^<]+)</loc>', sm)
print(f"Total sitemap URLs: {len(urls)}\n")
issues = []
for u in urls:
    r, chain = fetch(u, follow=True)
    c = canon(r["body"])
    rob = robots(r["body"])
    match = (c == u)
    flag = "OK"
    if r["status"] != 200:
        flag = f"STATUS {r['status']}"
    elif not c:
        flag = "NO CANONICAL"
    elif not match:
        flag = f"CANON MISMATCH ({c})"
    if flag != "OK":
        issues.append((u, flag))
    print(f"[{flag:18}] {r['status']}  canon={c}  {u}")

print("\n" + "="*120)
print("PART 2 — Non-canonical variants Google might crawl (should 301 to canonical or be correct)")
print("="*120)
# pick first product & blog slug from sitemap
prod = next((u for u in urls if "/products/" in u), None)
blog = next((u for u in urls if "/blog/" in u), None)

variants = [
    "/index.html",
    "/index.html?view=checkout",
    "/index.html?view=contact",
    "/index.html?view=track",
    "/index.html?view=about",
    "/index.html?view=home",
    "/shop",
    "/about",
    "/contact",
    "/faq",
    "/track",
    "/admin",
    "/products/rose-quartz-love-bracelet",   # no trailing slash
    "/blog" + (blog.replace(BASE+"/blog","") if blog else ""),  # no trailing slash
    "/shop/?category=love",
    "/?view=checkout",
    "/sitemap.xml",
    "/robots.txt",
    "/track.html",
    "/admin.html",
]
# fix blog no-slash form
if blog:
    bslug = blog.replace(BASE+"/blog","")
    variants[14] = "/blog" + bslug

for v in variants:
    u = BASE + v
    r, chain = fetch(u, follow=False)  # immediate response (no follow) to see 301 + its canonical
    c = canon(r["body"])
    rob = robots(r["body"])
    redir = ""
    if r["status"] in (301,302,307,308):
        loc = r["headers"].get("Location") or r["headers"].get("location")
        redir = f" -> {loc}"
    print(f"[{r['status']}] {v}{redir}  canon={c}  robots={rob}")

print("\n" + "="*120)
print("SUMMARY")
print("="*120)
if issues:
    print(f"PART 1 issues: {len(issues)}")
    for u, f in issues:
        print(f"  - {u}: {f}")
else:
    print("PART 1: ALL sitemap URLs self-reference their canonical correctly. OK")
print("Check PART 2: any 200 page with canonical=/ (homepage) that is NOT the homepage is a duplicate/alternate risk.")
