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

function absUrl(domain, p) {
  if (!p) return domain + '/images/p001.png';
  if (/^https?:\/\//i.test(p)) return p;
  return domain + (p.startsWith('/') ? '' : '/') + p;
}

function parseRoute(req) {
  const q = req.query || {};
  const pathname = (req.path || '/').split('?')[0];
  // Static real pages are served by express.static; only SPA routes hit SSR.
  if (pathname !== '/' && pathname !== '/index.html') {
    return { type: 'static', path: pathname };
  }
  if (q.product) return { type: 'product', id: String(q.product) };
  if (q.shop) {
    const v = String(q.shop);
    if (v === 'all' || v === '') return { type: 'shop', cat: null };
    if (v.startsWith('category:')) return { type: 'shop', cat: v.slice('category:'.length) };
    if (v.startsWith('intention:')) return { type: 'shop', intent: v.slice('intention:'.length) };
    return { type: 'shop', cat: v };
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
<nav><a href="/">Home</a><a href="/index.html?shop=all">Shop</a><a href="/index.html?view=about">About</a><a href="/contact.html">Contact</a></nav></header>
<main class="site-main">
${bodyHTML}
</main>
<footer class="site-footer"><p>Aurae — Where Energy Meets Well-Being. Authentic healing crystals, crystal jewelry, and energy tools.</p>
<p><a href="/index.html?shop=all">Shop Crystals</a> · <a href="/contact.html">Contact</a> · <a href="/privacy-policy.html">Privacy</a> · <a href="/terms-of-service.html">Terms</a></p></footer>
</body>
</html>`;
}

function productCard(p, domain) {
  const url = `${domain}/index.html?product=${encodeURIComponent(p.id)}`;
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
      { '@context': 'https://schema.org', '@type': 'WebSite', url: domain + '/', name: 'Aurae', potentialAction: { '@type': 'SearchAction', target: domain + '/index.html?shop={search_term_string}', 'query-input': 'required name=search_term_string' } },
      { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: featured.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: domain + '/index.html?product=' + encodeURIComponent(p.id), name: p.name })) }
    ];
    return { status: 200, html: doc({ title: 'Aurae — Where Energy Meets Well-Being', desc: 'Shop healing crystals, crystal jewelry, and energy tools. Where energy meets well-being.', canonical: domain + '/', domain, bodyHTML: body, jsonLd, gscMeta }) };
  }

  if (route.type === 'product') {
    const p = byId(route.id);
    if (!p) return { status: 404, html: doc({ title: 'Product not found — Aurae', desc: 'The requested product could not be found.', canonical: domain + '/index.html?shop=all', domain, bodyHTML: '<h1>Product not found</h1><p><a href="/index.html?shop=all">Browse all crystals</a></p>', jsonLd: [], gscMeta }) };
    const url = domain + '/index.html?product=' + encodeURIComponent(p.id);
    const img = absUrl(domain, p.image || (p.images && p.images[0]));
    const imgs = (Array.isArray(p.images) && p.images.length ? p.images : [p.image]).map(i => absUrl(domain, i));
    const cat = p.category || '';
    const catUrl = domain + '/index.html?shop=category:' + encodeURIComponent(cat);
    const availability = (Number(p.stock) > 0) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
    const price = Number(p.price || 0).toFixed(2);
    const body = `<nav class="breadcrumb"><a href="/">Home</a> &rsaquo; <a href="${esc(catUrl)}">${esc(catName(cat))}</a> &rsaquo; <span>${esc(p.name)}</span></nav>
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
        { '@type': 'ListItem', position: 2, name: catName(cat), item: catUrl },
        { '@type': 'ListItem', position: 3, name: p.name, item: url }
      ]
    }];
    if (!jsonLd[0].aggregateRating) delete jsonLd[0].aggregateRating;
    return { status: 200, html: doc({ title: `${p.name} — Aurae`, desc: (p.tagline || p.description || '').slice(0, 160), canonical: url, domain, bodyHTML: body, jsonLd, gscMeta }) };
  }

  if (route.type === 'shop') {
    let list = products;
    let title = 'All Crystal Jewelry';
    let subtitle = 'Discover authentic crystal jewelry crafted with intention for every energy need.';
    if (route.cat) {
      list = products.filter(p => p.category === route.cat);
      if (!list.length) return { status: 404, html: doc({ title: 'Category not found — Aurae', desc: 'This category could not be found.', canonical: domain + '/index.html?shop=all', domain, bodyHTML: '<h1>Category not found</h1><p><a href="/index.html?shop=all">Browse all crystals</a></p>', jsonLd: [], gscMeta }) };
      title = catName(route.cat) + ' Crystals & Jewelry';
    } else if (route.intent) {
      list = products.filter(p => p.intention === route.intent);
      title = 'Crystals for ' + catName(route.intent);
    }
    const body = `<h1>${esc(title)}</h1><p>${esc(subtitle)}</p>
<ul class="product-grid">${list.map(p => productCard(p, domain)).join('')}</ul>`;
    const jsonLd = [{ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: list.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: domain + '/index.html?product=' + encodeURIComponent(p.id), name: p.name })) }];
    const canonical = route.cat ? domain + '/index.html?shop=category:' + encodeURIComponent(route.cat) : domain + '/index.html?shop=all';
    return { status: 200, html: doc({ title: `${title} — Aurae`, desc: subtitle, canonical, domain, bodyHTML: body, jsonLd, gscMeta }) };
  }

  if (route.type === 'about') {
    const body = `<h1>About Aurae</h1>
<p>Aurae crafts authentic healing crystals, crystal jewelry, and energy tools with intention. Every piece is selected for its energy and beauty, helping you invite balance, protection, and well-being into daily life.</p>
<h2>Our Craft</h2><p>From raw stone to finished jewel, each creation is made to carry meaning — a small, daily ritual of intention.</p>`;
    return { status: 200, html: doc({ title: 'About Aurae — Our Story & Craft', desc: 'Learn about Aurae: our mission, our ethically-sourced crystals, and the intention behind every piece we craft.', canonical: domain + '/index.html?view=about', domain, bodyHTML: body, jsonLd: [], gscMeta }) };
  }

  if (route.type === 'contact') {
    const body = `<h1>Contact Aurae</h1>
<p>We're here to help with order questions, custom requests, or crystal guidance.</p>
<ul><li>Email: <a href="mailto:no-reply@mail.aurae.asia">no-reply@mail.aurae.asia</a></li><li>Visit: <a href="/contact.html">Contact page</a></li></ul>`;
    return { status: 200, html: doc({ title: 'Contact Aurae — We’re Here to Help', desc: 'Get in touch with the Aurae team for order questions, custom requests, or crystal guidance.', canonical: domain + '/contact.html', domain, bodyHTML: body, jsonLd: [], gscMeta }) };
  }

  if (route.type === 'blog') {
    const body = `<h1>Aurae Journal</h1><p>Stories, rituals, and crystal wisdom from the Aurae team.</p>`;
    return { status: 200, html: doc({ title: 'Aurae Journal — Crystal Wisdom', desc: 'Stories, rituals, and crystal wisdom from the Aurae team.', canonical: domain + '/index.html?blog=' + esc(route.id || ''), domain, bodyHTML: body, jsonLd: [], gscMeta }) };
  }

  // Unknown SPA route -> soft-404 eliminated: return 404 to crawler
  return { status: 404, html: doc({ title: 'Page not found — Aurae', desc: 'The page you requested could not be found.', canonical: domain + '/', domain, bodyHTML: '<h1>Page not found</h1><p><a href="/">Return home</a></p>', jsonLd: [], gscMeta }) };
}

module.exports = { isBot, parseRoute, renderSSR, BOT_UA };
