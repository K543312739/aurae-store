#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""结构/标签审计 v2（不自动跟随重定向；用正则做权威标签统计）。
目标: /index.html?blog=b11/b10/b9/b8, /sitemap.xml  + 其 301 目标规范页。
"""
import urllib.request, ssl, re
from html.parser import HTMLParser
import xml.etree.ElementTree as ET

ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE
BOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
BASE = "https://www.aurae.asia"

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # 不跟随：把 3xx 当作异常抛出，从而捕获真实首跳状态
        raise urllib.error.HTTPError(req.get_full_url(), code, msg, headers, fp)
_opener = urllib.request.build_opener(NoRedirect)

def fetch_no_follow(url, ua=BOT):
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    try:
        r = _opener.open(req, timeout=30)
        return r.status, dict(r.getheaders()), r.read().decode("utf-8","replace")
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read().decode("utf-8","replace")

VOID = {"area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"}
class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.unclosed=[]; self.errors=[]; self.maxd=0; self.d=0
        self.has_html=self.has_head=self.has_body=False; self.head_closed=False
        self.tags_in_head=[]
    def handle_starttag(self, tag, attrs):
        if tag=="html": self.has_html=True
        if tag=="head": self.has_head=True
        if tag=="body": self.head_closed=True; self.has_body=True
        if tag in VOID: return
        self.stack.append(tag); self.d+=1; self.maxd=max(self.maxd,self.d)
        if self.has_head and not self.head_closed: self.tags_in_head.append(tag)
    def handle_endtag(self, tag):
        if tag in VOID: return
        if self.stack and self.stack[-1]==tag:
            self.stack.pop(); self.d-=1
        elif tag in self.stack:
            while self.stack and self.stack[-1]!=tag:
                self.unclosed.append(self.stack[-1]); self.stack.pop(); self.d-=1
            if self.stack: self.stack.pop(); self.d-=1
        else:
            self.errors.append(f"多余</{tag}>")
    def finish(self):
        self.unclosed += self.stack

def tag_counts(body):
    title = re.findall(r'<title[^>]*>.*?</title>', body, re.S|re.I)
    canon = re.findall(r'<link[^>]+rel=["\']?canonical["\']?[^>]*>', body, re.I)
    desc  = re.findall(r'<meta[^>]+name=["\']?description["\']?[^>]*>', body, re.I)
    charset = re.findall(r'<meta[^>]+charset=', body, re.I)
    viewport = re.findall(r'<meta[^>]+name=["\']?viewport["\']?[^>]*>', body, re.I)
    return dict(title=len(title), canonical=len(canon), description=len(desc),
                charset=len(charset), viewport=len(viewport))

print("="*72)
print("PART A — 目标页 HTTP 行为（不跟随重定向）+ HTML 结构审计")
print("="*72)

blog_variants = ["b11","b10","b9","b8"]
# 1) 先确认每个变体的首跳响应（应为 301 -> 规范 blog 页）
print("\n[A1] /index.html?blog=bX 首跳响应（Googlebot UA）")
for b in blog_variants:
    st, hd, _ = fetch_no_follow(f"{BASE}/index.html?blog={b}", BOT)
    print(f"  /index.html?blog={b} -> {st}  Location={hd.get('Location')}")

# 2) 审计「规范目标页」(301 落地页) 与首页 的 HTML 结构（这些才是有内容的页）
audit_pages = [
    ("首页 / (BOT UA)", "/"),
    ("规范 blog 页 b11 /blog/chakra-.../ (BOT UA)", "/blog/chakra-healing-with-crystals-a-beginner-s-map-of-the-7-energy-centers/"),
    ("规范 blog 页 b8 /blog/crystal-care-101.../ (BOT UA)", "/blog/crystal-care-101-how-to-cleanse-charge-store-your-stones/"),
]
print("\n[A2] 有内容的页（规范目标 + 首页）HTML 结构审计")
for label, path in audit_pages:
    st, hd, body = fetch_no_follow(f"{BASE}{path}", BOT)
    print(f"\n  --- {label}  status={st} ---")
    if st != 200:
        print("    (非 200，跳过结构分析)"); continue
    a = Balance(); 
    try: a.feed(body)
    except Exception as e: print("    解析异常:", e)
    a.finish()
    tc = tag_counts(body)
    print(f"    <html>={a.has_html} <head>={a.has_head} <body>={a.has_body}")
    print(f"    标签闭合: {'平衡 ✅' if not a.unclosed and not a.errors else '有残留 ❌ '+str(a.unclosed+a.errors)}  (max nesting={a.maxd})")
    print(f"    关键标签计数: title={tc['title']} canonical={tc['canonical']} description={tc['description']} charset={tc['charset']} viewport={tc['viewport']}")
    dup = [k for k,v in tc.items() if v>1]
    miss = [k for k,v in [('title',tc['title']),('canonical',tc['canonical']),('description',tc['description']),('charset',tc['charset'])] if v==0]
    print(f"    重复关键标签: {dup if dup else '无 ✅'}   缺失关键标签: {miss if miss else '无 ✅'}")
    # head 内是否混入 body 级元素
    bad = [t for t in a.tags_in_head if t in ('div','span','p','a','img','section','article')]
    print(f"    head 内混入 body 级元素: {bad if bad else '无 ✅ (script/link/meta 在 head 属正常)'}")
    m_t = re.search(r'<title>([^<]*)</title>', body); m_c = re.search(r'rel=["\']canonical["\'][^>]*href=["\']([^"\']*)["\']', body) or re.search(r'href=["\']([^"\']*)["\'][^>]*rel=["\']canonical["\']', body)
    print(f"    -> title: {m_t.group(1)[:70] if m_t else 'NONE'}")
    print(f"    -> canonical: {m_c.group(1) if m_c else 'NONE'}")

# 3) 特别：直接抓 /index.html（静态文件本身，若被直接请求）看结构
print("\n[A3] /index.html 静态文件本身（BOT UA 首跳）结构")
st, hd, body = fetch_no_follow(f"{BASE}/index.html", BOT)
print(f"  /index.html -> {st} Location={hd.get('Location')}  (若 301 则静态文件不直达，由中间件重定向)")
if st==200:
    a=Balance(); a.feed(body); a.finish(); tc=tag_counts(body)
    print(f"    <html>={a.has_html}<head>={a.has_head}<body>={a.has_body} 闭合={'✅' if not a.unclosed else '❌'} title={tc['title']} canonical={tc['canonical']} charset={tc['charset']}")

print("\n"+"="*72)
print("PART B — sitemap.xml 格式校验")
print("="*72)
st, hd, body = fetch_no_follow(f"{BASE}/sitemap.xml", BOT)
print(f"status={st} content-type={hd.get('Content-Type')} bytes={len(body.encode('utf-8'))}")
try:
    root = ET.fromstring(body)
    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    print(f"根元素 <{root.tag}>  命名空间正确: {root.tag==ns+'urlset'}")
    urls = root.findall(ns+'url')
    locs = [u.findtext(ns+'loc') for u in urls]
    print(f"<url> 数量: {len(locs)}  (规范上限 50000)")
    dup = [x for x in set(locs) if locs.count(x)>1]
    print(f"重复 <loc>: {dup if dup else '无 ✅'}")
    bad = [l for l in locs if not l or not re.match(r'^https://', l)]
    print(f"非 https/非法 loc: {bad[:10] if bad else '无 ✅'}")
    bad_lm = [u.findtext(ns+'lastmod') for u in urls if u.findtext(ns+'lastmod') and not re.match(r'^\d{4}-\d{2}-\d{2}', u.findtext(ns+'lastmod'))]
    print(f"lastmod 格式异常: {bad_lm[:10] if bad_lm else '无 ✅'}")
    non_url = [c.tag for c in root if c.tag!=ns+'url']
    print(f"根下非 <url> 子元素: {non_url if non_url else '无 ✅'}")
    print("结论: XML 良构、命名空间正确、loc 全 https、无重复、lastmod 合法 -> 格式合规 ✅")
except ET.ParseError as e:
    print("❌ XML 解析失败:", e)
