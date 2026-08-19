// ===== SEO: Server-Side Rendering for crawlers (prerender) =====
// The storefront is a client-rendered SPA. Search engines that execute JS
// (Googlebot) can index it, but to guarantee complete, fast, first-class
// indexing we emit a fully-rendered HTML snapshot for bot requests while
// real users keep the rich SPA experience. Invalid SPA routes return 404 so
// crawlers never index soft-404 shells.

const fs = require('fs');
const path = require('path');

const BOT_UA = /(googlebot|bingbot|yandex|duckduckbot|baiduspider|slurp|facebookexternalhit|twitterbot|linkedinbot|pinterest|embedly|whatsapp|telegrambot|slackbot|discordbot|ia_archiver|applebot|rogerbot|dotbot|semrush|ahrefs|mj12bot|blexbot|seokicks|bytespider|crawler|spider|bot|preview)/i;

function isBot(req) {
  // Test override: ?__bot=1 forces SSR (used for verification without faking UA)
  if (req.query && req.query.__bot === '1') return true;
  const ua = (req.headers && req.headers['user-agent']) || '';
  return BOT_UA.test(ua);
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== Static URL scheme =====
// IMPORTANT: slugify() and the path builders MUST stay byte-for-byte identical
// to the copies in js/app.js so frontend and backend agree on every URL.
function slugify(s) {
  return String(s == null ? '' : s).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
function productPath(p) { return '/products/' + slugify(p && p.name) + '/'; }
function blogPath(b) { return '/blog/' + slugify(b && b.title) + '/'; }
function shopPath(param) {
  const v = String(param == null ? 'all' : param);
  if (v === 'all' || v === '') return '/shop/';
  if (v.startsWith('category:')) return '/shop/' + slugify(v.slice('category:'.length)) + '/';
  if (v.startsWith('intention:')) return '/shop/intention/' + slugify(v.slice('intention:'.length)) + '/';
  return '/shop/';
}

// Humanized (plural) category display names — keep in sync with js/data.js CATEGORIES.
const CATEGORY_NAMES = { bracelet: 'Bracelets', necklace: 'Necklaces', pendant: 'Pendants', ring: 'Rings', earring: 'Earrings' };
function catDisplay(c) { return CATEGORY_NAMES[c] || (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All'); }

function absUrl(domain, p) {
  if (!p) return domain + '/images/p001.png';
  if (/^https?:\/\//i.test(p)) return p;
  return domain + (p.startsWith('/') ? '' : '/') + p;
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

let cachedBlogPosts = null;
function loadBlogPosts() {
  if (cachedBlogPosts) return cachedBlogPosts;
  try {
    const dataJs = fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf8');
    // Match the BLOG_POSTS array literal up to its closing ]; (followed by optional semicolon + blank line + window.PRODUCTS)
    const match = dataJs.match(/const BLOG_POSTS\s*=\s*(\[[\s\S]*?\n\]\s*);?\s*\nwindow\.PRODUCTS\s*=\s*PRODUCTS;/);
    if (match) {
      cachedBlogPosts = Function('"use strict"; return ' + match[1])();
      return cachedBlogPosts;
    }
  } catch (e) {
    console.error('[SSR] Failed to load BLOG_POSTS:', e.message);
  }
  cachedBlogPosts = [];
  return cachedBlogPosts;
}

function parseRoute(req) {
  const q = req.query || {};
  let pathname = (req.path || '/').split('?')[0];
  pathname = pathname.replace(/\/+$/, '') || '/';

  // New static SEO paths. Only SPA roots reach here; real files are served by
  // express.static. Resolve slugs to ids in renderSSR (which has products/blogs).
  if (pathname !== '/' && pathname !== '/index.html') {
    if (pathname === '/shop') return { type: 'shop', cat: null, intent: null };
    if (pathname.startsWith('/shop/intention/')) return { type: 'shop', cat: null, intent: pathname.slice('/shop/intention/'.length) };
    if (pathname.startsWith('/shop/')) return { type: 'shop', cat: pathname.slice('/shop/'.length), intent: null };
    if (pathname === '/about') return { type: 'about' };
    if (pathname.startsWith('/products/')) return { type: 'product', slug: pathname.slice('/products/'.length) };
    if (pathname.startsWith('/blog/')) return { type: 'blog', slug: pathname.slice('/blog/'.length) };
    return { type: 'static', path: pathname };
  }

  // Legacy query-string routes (server.js 301-redirects these to static, but we
  // keep parsing them so a stray link never 404s).
  if (q.product) return { type: 'product', id: String(q.product) };
  if (q.shop) {
    const v = String(q.shop);
    if (v === 'all' || v === '') return { type: 'shop', cat: null, intent: null };
    if (v.startsWith('category:')) return { type: 'shop', cat: v.slice('category:'.length), intent: null };
    if (v.startsWith('intention:')) return { type: 'shop', cat: null, intent: v.slice('intention:'.length) };
    return { type: 'shop', cat: v, intent: null };
  }
  if (q.view) {
    const v = String(q.view);
    if (v === 'about') return { type: 'about' };
    if (v === 'contact') return { type: 'contact' };
    if (v === 'home') return { type: 'home' };
    return { type: 'notfound' }; // unknown view -> crawler gets a real 404
  }
  if (q.blog) return { type: 'blog', id: String(q.blog) };
  return { type: 'home' };
}

// Build the 301 target for legacy dynamic URLs (used by server.js middleware).
// Returns a static path string, or null when the request must NOT be redirected.
function legacyRedirectTarget(pathname, query, products, blogs) {
  if (!query) return null;
  const keys = Object.keys(query);
  // Never touch payment/order return URLs.
  if (keys.some(k => k === 'order_success' || k === 'order_id' || k === 'token' || k === 'PayerID')) return null;
  const p = (pathname || '/').replace(/\/+$/, '') || '/';
  if (p !== '/' && p !== '/index.html') return null;
  if (keys.length === 0) return (p === '/index.html') ? '/' : null;
  if (query.product) {
    const prod = (products || []).find(x => x.id === String(query.product));
    return prod ? productPath(prod) : null;
  }
  if (query.blog) {
    const blog = (blogs || []).find(x => x.id === String(query.blog));
    return blog ? blogPath(blog) : null;
  }
  if (query.shop !== undefined) return shopPath(String(query.shop));
  if (query.view !== undefined) {
    if (String(query.view) === 'about') return '/about/';
    return null; // contact/track/checkout etc → leave functional URLs as-is
  }
  return null;
}

function doc({ title, desc, canonical, domain, bodyHTML, jsonLd, gscMeta }) {
  const og = `
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Aurae">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(desc)}">
    <meta property="og:url" content="${esc(canonical)}">
    <meta property="og:image" content="${esc(domain)}/images/p001.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(desc)}">
    <meta name="twitter:image" content="${esc(domain)}/images/p001.png">`;
  const ld = jsonLd && jsonLd.length
    ? jsonLd.map(j => `\n<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('')
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${esc(canonical)}">
${gscMeta || ''}<meta name="p:domain_verify" content="8b5eb8e9d7b52fafb4763d382061e459"/>
${og}${ld}
</head>
<body>
<header class="site-header"><a href="/" class="logo">Aur<span>ae</span></a>
<nav><a href="/">Home</a><a href="/shop/">Shop</a><a href="/about/">About</a><a href="/contact.html">Contact</a></nav></header>
<main class="site-main">
${bodyHTML}
</main>
<footer class="site-footer"><p>Aurae — Where Energy Meets Well-Being. Authentic healing crystals, crystal jewelry, and energy tools.</p>
<p><a href="/shop/">Shop Crystals</a> · <a href="/contact.html">Contact</a> · <a href="/privacy-policy.html">Privacy</a> · <a href="/terms-of-service.html">Terms</a></p></footer>
</body>
</html>`;
}

function productCard(p, domain) {
  const url = `${domain}${productPath(p)}`;
  const img = absUrl(domain, p.image || (p.images && p.images[0]));
  return `<li class="product">
  <a href="${esc(url)}">
    <img src="${esc(img)}" alt="${esc(p.name)}" loading="lazy" width="300" height="300">
    <h3>${esc(p.name)}</h3>
    <span class="price">$${Number(p.price || 0).toFixed(2)}</span>
  </a>
</li>`;
}

function renderSSR(req, ctx) {
  const { products = [], domain } = ctx;
  const gscMeta = ctx.gscMeta || '';
  const route = parseRoute(req);
  const byId = id => products.find(p => p.id === id);
  const catName = c => (c ? c.charAt(0).toUpperCase() + c.slice(1) : 'All');

  if (route.type === 'static') return null; // let express.static serve real files

  if (route.type === 'home') {
    const featured = products.slice(0, 12);
    const body = `<h1>Aurae — Where Energy Meets Well-Being</h1>
<p>Shop authentic healing crystals, crystal jewelry, and energy tools crafted with intention for balance, protection, and well-being.</p>
<h2>Featured Crystals &amp; Jewelry</h2>
<ul class="product-grid">${featured.map(p => productCard(p, domain)).join('')}</ul>`;
    const jsonLd = [
      { '@context': 'https://schema.org', '@type': 'Organization', name: 'Aurae', url: domain + '/', logo: domain + '/images/p001.png', description: 'Authentic healing crystals, crystal jewelry, and energy tools crafted with intention.' },
      { '@context': 'https://schema.org', '@type': 'WebSite', url: domain + '/', name: 'Aurae', potentialAction: { '@type': 'SearchAction', target: domain + '/shop/?search={search_term_string}', 'query-input': 'required name=search_term_string' } },
      { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: featured.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: domain + productPath(p), name: p.name })) }
    ];
    return { status: 200, html: doc({ title: 'Aurae — Where Energy Meets Well-Being', desc: 'Shop healing crystals, crystal jewelry, and energy tools. Where energy meets well-being.', canonical: domain + '/', domain, bodyHTML: body, jsonLd, gscMeta }) };
  }

  if (route.type === 'product') {
    const p = route.slug ? products.find(x => slugify(x.name) === route.slug) : byId(route.id);
    if (!p) return { status: 404, html: doc({ title: 'Product not found — Aurae', desc: 'The requested product could not be found.', canonical: domain + '/shop/', domain, bodyHTML: '<h1>Product not found</h1><p><a href="/shop/">Browse all crystals</a></p>', jsonLd: [], gscMeta }) };
    const url = domain + productPath(p);
    const img = absUrl(domain, p.image || (p.images && p.images[0]));
    const imgs = (Array.isArray(p.images) && p.images.length ? p.images : [p.image]).map(i => absUrl(domain, i));
    const cat = p.category || '';
    const catUrl = domain + shopPath('category:' + cat);
    const availability = (Number(p.stock) > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    const price = Number(p.price || 0).toFixed(2);
    const body = `<nav class="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="${esc(catUrl)}">${esc(catDisplay(cat))}</a> &rsaquo; <span>${esc(p.name)}</span></nav>
<h1>${esc(p.name)}</h1>
<img class="hero" src="${esc(img)}" alt="${esc(p.name)}" width="600" height="600">
<p class="price">$${price}${p.compareAt ? ` <s class="compare">$${Number(p.compareAt).toFixed(2)}</s>` : ''}</p>
<p class="tagline">${esc(p.tagline || '')}</p>
<div class="description">${esc(p.description || '')}</div>
${p.ritual ? `<h2>Ritual</h2><p>${esc(p.ritual)}</p>` : ''}
<p class="availability">${Number(p.stock) > 0 ? 'In stock' : 'Out of stock'}</p>`;
    const jsonLd = [{
      '@context': 'https://schema.org', '@type': 'Product',
      name: p.name, image: imgs, description: (p.tagline || p.description || '').slice(0, 300),
      brand: { '@type': 'Brand', name: 'Aurae' },
      offers: { '@type': 'Offer', url, priceCurrency: 'USD', price, availability, seller: { '@type': 'Organization', name: 'Aurae' } },
      aggregateRating: (p.rating ? { '@type': 'AggregateRating', ratingValue: String(p.rating), reviewCount: String(p.reviews || 0) } : undefined)
    }, {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: domain + '/' },
        { '@type': 'ListItem', position: 2, name: catDisplay(cat), item: catUrl },
        { '@type': 'ListItem', position: 3, name: p.name, item: url }
      ]
    }];
    if (!jsonLd[0].aggregateRating) delete jsonLd[0].aggregateRating;
    return { status: 200, html: doc({ title: `${p.name} | Aurae`, desc: (p.tagline || p.description || '').slice(0, 160), canonical: url, domain, bodyHTML: body, jsonLd, gscMeta }) };
  }

  if (route.type === 'shop') {
    let list = products;
    let title = 'Shop Crystal Jewelry';
    let subtitle = 'Discover authentic crystal jewelry crafted with intention for every energy need.';
    if (route.cat) {
      list = products.filter(p => slugify(p.category) === route.cat);
      if (!list.length) return { status: 404, html: doc({ title: 'Category not found — Aurae', desc: 'This category could not be found.', canonical: domain + '/shop/', domain, bodyHTML: '<h1>Category not found</h1><p><a href="/shop/">Browse all crystals</a></p>', jsonLd: [], gscMeta }) };
      title = catDisplay(route.cat);
    } else if (route.intent) {
      list = products.filter(p => slugify(p.intention) === route.intent);
      title = 'Crystals for ' + catName(route.intent);
    }
    const body = `<h1>${esc(title)}</h1><p>${esc(subtitle)}</p>
<ul class="product-grid">${list.map(p => productCard(p, domain)).join('')}</ul>`;
    const jsonLd = [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: domain + productPath(p), name: p.name })) }];
    const param = route.cat ? 'category:' + route.cat : (route.intent ? 'intention:' + route.intent : 'all');
    const canonical = domain + shopPath(param);
    return { status: 200, html: doc({ title: `${title} | Aurae`, desc: subtitle, canonical, domain, bodyHTML: body, jsonLd, gscMeta }) };
  }

  if (route.type === 'about') {
    const body = `<h1>About Aurae</h1>
<p>Aurae crafts authentic healing crystals, crystal jewelry, and energy tools with intention. Every piece is selected for its energy and beauty, helping you invite balance, protection, and well-being into daily life.</p>
<h2>Our Craft</h2><p>From raw stone to finished jewel, each creation is made to carry meaning — a small, daily ritual of intention.</p>`;
    return { status: 200, html: doc({ title: 'About Aurae — Our Story & Mission', desc: 'Learn about Aurae: our mission, our ethically-sourced crystals, and the intention behind every piece we craft.', canonical: domain + '/about/', domain, bodyHTML: body, jsonLd: [], gscMeta }) };
  }

  if (route.type === 'contact') {
    const body = `<h1>Contact Aurae</h1>
<p>We're here to help with order questions, custom requests, or crystal guidance.</p>
<ul><li>Email: <a href="mailto:no-reply@mail.aurae.asia">no-reply@mail.aurae.asia</a></li><li>Visit: <a href="/contact.html">Contact page</a></li></ul>`;
    return { status: 200, html: doc({ title: 'Contact Aurae — Get in Touch', desc: 'Get in touch with the Aurae team for order questions, custom requests, or crystal guidance.', canonical: domain + '/contact.html', domain, bodyHTML: body, jsonLd: [], gscMeta }) };
  }

  if (route.type === 'blog') {
    const blogs = loadBlogPosts();
    const blog = route.slug ? blogs.find(b => slugify(b.title) === route.slug) : blogs.find(b => b.id === route.id);
    if (!blog) {
      return { status: 404, html: doc({ title: 'Article not found — Aurae', desc: 'The requested article could not be found.', canonical: domain + '/', domain, bodyHTML: '<h1>Article not found</h1><p><a href="/">Return home</a></p>', jsonLd: [], gscMeta }) };
    }
    const url = domain + blogPath(blog);
    const img = absUrl(domain, blog.image);
    const desc = stripTags(blog.excerpt || blog.content).slice(0, 160);
    const body = `<article class="blog-post">
<h1>${esc(blog.title)}</h1>
<p class="blog-meta">${esc(blog.readTime || '')} · ${esc(blog.category ? blog.category.charAt(0).toUpperCase() + blog.category.slice(1) : '')}</p>
<img class="hero" src="${esc(img)}" alt="${esc(blog.title)}" width="800" height="600">
<div class="blog-content">${blog.content}</div>
</article>`;
    const jsonLd = [{
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: blog.title,
      description: desc,
      image: img,
      url: url,
      datePublished: new Date().toISOString(),
      author: { '@type': 'Organization', name: 'Aurae' },
      publisher: { '@type': 'Organization', name: 'Aurae', logo: { '@type': 'ImageObject', url: domain + '/images/p001.png' } }
    }];
    return { status: 200, html: doc({ title: `${blog.title} | Aurae`, desc, canonical: url, domain, bodyHTML: body, jsonLd, gscMeta }) };
  }

  // Unknown SPA route -> soft-404 eliminated: return 404 to crawler
  return { status: 404, html: doc({ title: 'Page not found — Aurae', desc: 'The page you requested could not be found.', canonical: domain + '/', domain, bodyHTML: '<h1>Page not found</h1><p><a href="/">Return home</a></p>', jsonLd: [], gscMeta }) };
}

// Per-page SEO head metadata (title / description / canonical) for a request.
// Used by server.js to inject the correct <head> tags into the SPA shell that is
// served to real (non-bot) users, so "View Source" shows the right title and
// canonical instead of the homepage defaults. Returns null when no injection is
// needed (unknown/functional routes).
function getPageMeta(req, ctx) {
  const { products = [], domain } = ctx;
  const route = parseRoute(req);
  const SHOP_DESC = 'Discover authentic crystal jewelry crafted with intention for every energy need.';

  if (route.type === 'home') {
    return { title: 'Aurae — Where Energy Meets Well-Being', desc: 'Shop healing crystals, crystal jewelry, and energy tools. Where energy meets well-being.', canonical: domain + '/' };
  }
  if (route.type === 'product') {
    const p = route.slug ? products.find(x => slugify(x.name) === route.slug) : products.find(x => x.id === route.id);
    if (!p) return null;
    return { title: `${p.name} | Aurae`, desc: (p.tagline || p.description || '').slice(0, 160), canonical: domain + productPath(p) };
  }
  if (route.type === 'blog') {
    const blogs = loadBlogPosts();
    const blog = route.slug ? blogs.find(b => slugify(b.title) === route.slug) : blogs.find(b => b.id === route.id);
    if (!blog) return null;
    return { title: `${blog.title} | Aurae`, desc: stripTags(blog.excerpt || blog.content).slice(0, 160), canonical: domain + blogPath(blog) };
  }
  if (route.type === 'shop') {
    if (route.cat) return { title: `${catDisplay(route.cat)} | Aurae`, desc: SHOP_DESC, canonical: domain + shopPath('category:' + route.cat) };
    if (route.intent) {
      const intent = route.intent.charAt(0).toUpperCase() + route.intent.slice(1);
      return { title: `Crystals for ${intent} | Aurae`, desc: SHOP_DESC, canonical: domain + shopPath('intention:' + route.intent) };
    }
    return { title: 'Shop Crystal Jewelry | Aurae', desc: SHOP_DESC, canonical: domain + '/shop/' };
  }
  if (route.type === 'about') {
    return { title: 'About Aurae — Our Story & Mission', desc: 'Learn about Aurae: our mission, our ethically-sourced crystals, and the intention behind every piece we craft.', canonical: domain + '/about/' };
  }
  if (route.type === 'contact') {
    return { title: 'Contact Aurae — Get in Touch', desc: 'Get in touch with the Aurae team for order questions, custom requests, or crystal guidance.', canonical: domain + '/contact.html' };
  }
  return null;
}

module.exports = {
  isBot, parseRoute, renderSSR, BOT_UA,
  slugify, productPath, blogPath, shopPath,
  loadBlogPosts, legacyRedirectTarget, getPageMeta
};
