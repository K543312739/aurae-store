/**
 * Aurae - Payment Server
 * 
 * Express server with Stripe Checkout + PayPal integration
 * Serves both the static frontend and payment API endpoints
 * 
 * Prerequisites:
 *   1. Copy .env.example to .env and fill in your keys
 *   2. npm install (in the node workspace)
 *   3. node server/server.js
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// ===== SEO: crawler prerender + Google Search Console verification =====
const ssr = require('./ssr');
const GSC_VERIFICATION = (process.env.GSC_VERIFICATION || '').trim();
const GSC_HTML = (process.env.GSC_HTML_VERIFICATION || '').trim();
const GSC_META = GSC_VERIFICATION
  ? `<meta name="google-site-verification" content="${GSC_VERIFICATION}">`
  : '';

// ===== Crash resilience: keep the process alive on unexpected errors =====
// (PM2 will still restart on a real crash; this prevents a single bad request
//  from taking the whole site down.)
process.on('uncaughtException', (err) => {
  console.error('[FATAL] uncaughtException:', (err && err.stack) || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] unhandledRejection:', (reason && reason.stack) || reason);
});

// ===== Security headers =====
app.disable('x-powered-by');
app.set('trust proxy', true); // site runs behind nginx / a load balancer

// ===== Middleware =====
const ALLOWED_ORIGINS = [
  'https://www.aurae.asia',
  'https://aurae.asia',
  'http://localhost:3999',
  'http://localhost:8080',
  'http://127.0.0.1:3999',
  'http://127.0.0.1:8080',
];
app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true); // same-origin / non-browser requests
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return cb(null, true);
    cb(null, false);
  },
}));
// ===== Security hardening headers (added during security audit 2026-08-10) =====
// Content-Security-Policy (added 2026-08-13):
// The storefront is a client-rendered SPA that relies heavily on inline event
// handlers (onclick) and inline styles, so 'unsafe-inline' is permitted for
// script/style. The policy still blocks the most dangerous XSS vector — loading
// scripts/styles/frames from untrusted external origins — and locks down
// base-uri, form-action and frame-ancestors. Allowed third parties: PayPal
// (payments), Pinterest (tag), Google Fonts, Google Analytics 4 (gtag).
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com https://s.pinimg.com https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https: https://www.google-analytics.com",
  "connect-src 'self' https://ct.pinterest.com https://s.pinimg.com https://www.paypal.com https://www.sandbox.paypal.com https://www.google-analytics.com",
  "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://ct.pinterest.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests"
].join('; ');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  // Do not send CSP on plain-text/XML static resources (sitemap, robots) to avoid
  // confusing crawlers / Search Console parsers.
  const p = (req.path || '').toLowerCase();
  if (!p.endsWith('/sitemap.xml') && !p.endsWith('/robots.txt')) {
    res.setHeader('Content-Security-Policy', CSP_DIRECTIVES);
  }
  next();
});
// Capture the raw body buffer (req.rawBody) so webhook routes can verify
// signatures against the exact bytes PayPal/Stripe sent. Without this, the
// JSON body parser already consumes the stream and webhook signature
// verification would run against a re-serialized (and therefore mismatched) body.
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ===== Security: block access to server/runtime/sensitive files =====
// express.static would otherwise serve anything under the project root
// (e.g. /server/users.json, /server/server.js, /package.json).
const SENSITIVE_PREFIXES = ['/server/', '/node_modules/', '/.git/'];
const SENSITIVE_FILES = ['/package.json', '/package-lock.json', '/server.js', '/.env'];
// Developer / infra / documentation files that must never be web-served.
// Serving these leaks server architecture and (sandbox) credentials.
const BLOCKED_EXT = new Set(['.sh', '.yaml', '.yml', '.md', '.log', '.sql', '.bak', '.old', '.tmp']);
const BLOCKED_FILES = new Set([
  'full-audit.js', '_extract.js', '_gen_products.js', '_check.html',
  'deploy.sh', 'setup-https.sh', 'render.yaml', 'render.yml',
  'deployment.md', 'render-deploy.md',
  'paypal支付接入指南.md', '支付接入配置指南.md', '供应商方案与运营指南.md', '独立站维护与成本指南.md',
]);
app.use((req, res, next) => {
  const p = (req.path || '').toLowerCase();
  if (p.startsWith('/.well-known/')) return next(); // Let's Encrypt ACME challenge
  if (SENSITIVE_PREFIXES.some((s) => p.startsWith(s))) return res.status(404).end();
  if (SENSITIVE_FILES.includes(p) || p.endsWith('.env')) return res.status(404).end();
  if (p.split('/').some((seg) => seg.startsWith('.'))) return res.status(404).end();
  // Block developer/infra/doc files (info disclosure)
  if (BLOCKED_FILES.has(p.replace(/^\/+/, '').replace(/\/+$/, ''))) return res.status(404).end();
  const ext = p.includes('.') ? '.' + p.split('.').pop() : '';
  if (BLOCKED_EXT.has(ext)) return res.status(404).end();
  if (p.split('/').some((seg) => seg.startsWith('_'))) return res.status(404).end();
  next();
});

// ===== Simple in-memory rate limiter (no external deps) =====
const rateBuckets = new Map();
function rateLimit(windowMs, max) {
  return (req, res, next) => {
    const key = (req.ip || req.headers['x-forwarded-for'] || 'unknown') + ':' + (req.baseUrl || req.path);
    const now = Date.now();
    const rec = rateBuckets.get(key) || { count: 0, start: now };
    if (now - rec.start > windowMs) { rec.count = 0; rec.start = now; }
    rec.count += 1;
    rateBuckets.set(key, rec);
    if (rec.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again.' });
    }
    next();
  };
}
const authLimiter = rateLimit(60 * 1000, 15);   // login / register
const publicLimiter = rateLimit(60 * 1000, 20); // reviews / contact
app.use('/api/admin', rateLimit(60 * 1000, 200)); // admin surface
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (now - v.start > 120 * 1000) rateBuckets.delete(k);
  }
}, 60 * 1000);

// Serve static frontend files from parent directory
const frontendDir = path.join(__dirname, '..');

// ===== SEO: 301 normalize trailing slash on SPA content routes =====
// Googlebot probes both "/products/x" and "/products/x/". Without this, both
// return 200 — the no-slash copy carrying a canonical pointing at the slash
// copy — which GSC reports as "Alternate page with proper canonical tag".
// Canonicalize every SPA route to its trailing-slash form so there is exactly
// one indexable URL per page. Query strings (e.g. /shop?search=) are preserved.
function trailingSlashTarget(pathname, query) {
  if (!pathname || pathname === '/' || pathname.endsWith('/')) return null;
  if (pathname.includes('.') || pathname.startsWith('/api/')) return null;
  const SPA_ROUTES = [
    /^\/shop$/,
    /^\/shop\/([^/]+)$/,
    /^\/shop\/intention\/([^/]+)$/,
    /^\/products\/([^/]+)$/,
    /^\/blog\/([^/]+)$/,
    /^\/about$/,
  ];
  let matched = false;
  for (const re of SPA_ROUTES) { if (re.test(pathname)) { matched = true; break; } }
  if (!matched) return null;
  const qs = query && Object.keys(query).length
    ? '?' + new URLSearchParams(query).toString()
    : '';
  return pathname + '/' + qs;
}
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  const target = trailingSlashTarget(req.path, req.query);
  if (target) return res.redirect(301, target);
  next();
});

// ===== SEO: 301 redirect legacy dynamic URLs → static URLs =====
// Keeps every old ?product= / ?blog= / ?shop= / ?view=about link alive (no 404s)
// while consolidating link equity onto the new clean, keyword-rich URLs.
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();
  if ((req.path || '').startsWith('/api/')) return next();
  const target = ssr.legacyRedirectTarget(req.path, req.query, loadProducts(), ssr.loadBlogPosts());
  if (target) return res.redirect(301, target);
  next();
});

// ===== SEO: server-side prerender for crawlers =====
// Mounted BEFORE express.static so bot requests to "/" return a fully-rendered
// HTML snapshot (with product data + JSON-LD), not the empty SPA shell.
// Real users (non-bot UA) skip this and get the rich SPA; real static assets
// (css/js/images) are passed through to express.static via next().
app.use((req, res, next) => {
  if (!ssr.isBot(req)) return next();
  const result = ssr.renderSSR(req, { products: loadProducts(), domain: DOMAIN, gscMeta: GSC_META });
  if (!result) return next();
  res.status(result.status).send(result.html);
});

// Google Search Console HTML-file verification (set GSC_HTML_VERIFICATION env to
// the full contents of the google<code>.html file provided by GSC).
if (GSC_HTML) {
  app.get('/google*.html', (req, res) => res.type('html').send(GSC_HTML));
}

// Serve sitemap/robots with explicitly clean headers. Google Search Console is
// sensitive to stale cache headers and middleware-added Last-Modified, so we
// bypass express.static for these files and emit deterministic headers.
function serveCleanStaticFile(fileName, contentType) {
  return (req, res) => {
    const filePath = path.join(frontendDir, fileName);
    if (!fs.existsSync(filePath)) return res.status(404).end();
    const content = fs.readFileSync(filePath);
    res.removeHeader('ETag');
    res.removeHeader('Last-Modified');
    res.removeHeader('Accept-Ranges');
    res.removeHeader('Cache-Control');
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.write(content);
    res.end();
  };
}
app.get('/sitemap.xml', serveCleanStaticFile('sitemap.xml', 'text/xml; charset=utf-8'));
// Legacy sitemap URLs are removed — return 404 so crawlers drop them.
app.get('/sitemap-google.xml', (req, res) => res.status(404).end());
app.get('/sitemap-v3.xml', (req, res) => res.status(404).end());
app.get('/robots.txt', serveCleanStaticFile('robots.txt', 'text/plain; charset=utf-8'));

app.use(express.static(frontendDir, {
  dotfiles: 'deny',
  setHeaders: (res, filePath) => {
    const lowerPath = filePath.toLowerCase();
    if (lowerPath.endsWith('sitemap.xml')) {
      res.set('Content-Type', 'text/xml; charset=utf-8');
      res.removeHeader('ETag');
      res.removeHeader('Cache-Control');
      res.removeHeader('Last-Modified');
      res.removeHeader('Accept-Ranges');
    }
  }
}));

// ===== Product image uploads =====
const UPLOADS_DIR = path.join(frontendDir, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase().slice(0, 10);
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext) ? ext : '.png';
    const base = 'prod-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, base + safeExt);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ===== Review photo uploads (separate dir from product images) =====
const REVIEWS_UPLOAD_DIR = path.join(frontendDir, 'uploads', 'reviews');
if (!fs.existsSync(REVIEWS_UPLOAD_DIR)) fs.mkdirSync(REVIEWS_UPLOAD_DIR, { recursive: true });
const reviewStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, REVIEWS_UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '').toLowerCase().slice(0, 10);
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext) ? ext : '.png';
    const base = 'rev-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex');
    cb(null, base + safeExt);
  },
});
const reviewUpload = multer({
  storage: reviewStorage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Stripe needs raw body for webhook verification
app.post('/api/stripe-webhook', express.raw({ type: 'application/json', limit: '5mb' }), (req, res) => {
  handleStripeWebhook(req, res);
});

// PayPal webhook: uses req.rawBody (captured by the global JSON parser) for
// PayPal signature verification against its verify-webhook-signature endpoint.
app.post('/api/paypal-webhook', express.raw({ type: 'application/json', limit: '5mb' }), (req, res) => {
  handlePayPalWebhook(req, res);
});

// ===== Config =====
const PORT = process.env.PORT || 8080;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

// Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('[Stripe] Initialized' + (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? ' (TEST MODE)' : ' (LIVE MODE)'));
} else {
  console.warn('[Stripe] No STRIPE_SECRET_KEY found. Stripe payments will not work.');
}

// PayPal
const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

let paypalAccessToken = null;
let paypalTokenExpiry = 0;

async function getPayPalAccessToken() {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }
  
  // Check if token is still valid (with 60s buffer)
  if (paypalAccessToken && Date.now() < paypalTokenExpiry - 60000) {
    return paypalAccessToken;
  }

  const auth = Buffer.from(
    process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET
  ).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`PayPal auth failed: ${error}`);
  }

  const data = await response.json();
  paypalAccessToken = data.access_token;
  paypalTokenExpiry = Date.now() + (data.expires_in * 1000);
  console.log('[PayPal] Access token refreshed' + (process.env.PAYPAL_MODE === 'live' ? ' (LIVE)' : ' (SANDBOX)'));
  return paypalAccessToken;
}

// ===== Order Storage (JSON file based) =====
const ORDERS_FILE = path.join(__dirname, 'orders.json');

function loadOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading orders:', e.message);
  }
  return [];
}

function saveOrder(order) {
  const orders = loadOrders();
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  console.log(`[Order] Saved: ${order.orderId} - ${order.status} - $${order.totals?.total ?? order.total}`);
}

function updateOrder(orderId, updates) {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === orderId);
  if (idx >= 0) {
    Object.assign(orders[idx], updates);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    console.log(`[Order] Updated: ${orderId} - ${updates.status || 'modified'}`);
  }
}

// ===== Message Storage (JSON file based) =====
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

function loadMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      return JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading messages:', e.message);
  }
  return [];
}

function saveMessage(message) {
  const messages = loadMessages();
  messages.push(message);
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  console.log(`[Message] Saved from ${message.name} <${message.email}> — ${message.subject}`);
}

// ===== Review Storage (JSON file based) =====
const REVIEWS_FILE = path.join(__dirname, 'reviews.json');

function loadReviews() {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading reviews:', e.message);
  }
  return [];
}

function saveReview(review) {
  const reviews = loadReviews();
  reviews.push(review);
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  console.log(`[Review] Saved for ${review.productId} by ${review.name} — ${review.rating}★`);
}

// ===== User Storage (JSON file based) — customer accounts =====
const USERS_FILE = path.join(__dirname, 'users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading users:', e.message);
  }
  return [];
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function saveUser(user) {
  const users = loadUsers();
  const idx = users.findIndex(u => u.email === user.email);
  if (idx >= 0) users[idx] = user;
  else users.push(user);
  saveUsers(users);
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt };
}

// ===== Product Storage (JSON file based) — inventory authority =====
const PRODUCTS_FILE = path.join(__dirname, 'products.json');

function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
    }
  } catch (e) { console.error('Error loading products:', e.message); }
  return [];
}

function saveProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  // Keep the static sitemap in sync whenever products change via the admin UI.
  try { writeSitemapFile(DOMAIN || '', products); } catch (e) { console.error('[sitemap] failed to regenerate after saveProducts:', e.message); }
}

// Generate sitemap XML. Kept as a reusable helper so we can write a real
// static file (more GSC-friendly than a dynamic route) and regenerate it
// whenever products change.
function generateSitemapXML(domain, products) {
  const today = new Date().toISOString().slice(0, 10);
  const escapeXML = (str) => String(str || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
  const url = (loc, priority = '0.6', changefreq = 'weekly') => `  <url>\n    <loc>${escapeXML(loc)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

  const urls = [
    url(`${domain}/`, '1.0', 'daily'),
    url(`${domain}/shop/`, '0.9', 'weekly'),
    url(`${domain}/about/`, '0.7', 'monthly'),
    url(`${domain}/contact.html`, '0.6', 'monthly'),
    url(`${domain}/faq.html`, '0.6', 'monthly'),
    url(`${domain}/privacy-policy.html`, '0.4', 'monthly'),
    url(`${domain}/shipping-returns.html`, '0.4', 'monthly'),
    url(`${domain}/refund-policy.html`, '0.4', 'monthly'),
    url(`${domain}/terms-of-service.html`, '0.4', 'monthly'),
  ];

  (products || []).forEach(p => {
    urls.push(url(`${domain}${ssr.productPath(p)}`, '0.8', 'weekly'));
  });

  const categories = [...new Set((products || []).map(p => p.category).filter(Boolean))];
  categories.forEach(c => {
    urls.push(url(`${domain}${ssr.shopPath(`category:${c}`)}`, '0.7', 'weekly'));
  });

  // Blog posts — derived live from BLOG_POSTS so slugs always match data.js.
  const blogs = ssr.loadBlogPosts();
  generateSitemapXML.BLOG_IDS = blogs.map(b => b.id);
  blogs.forEach(b => {
    urls.push(url(`${domain}${ssr.blogPath(b)}`, '0.6', 'monthly'));
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

function writeSitemapFile(domain, products) {
  if (!domain) return;
  const xml = generateSitemapXML(domain, products);
  const filePath = path.join(frontendDir, 'sitemap.xml');
  fs.writeFileSync(filePath, xml, 'utf8');
  // Only sitemap.xml is kept. Remove legacy mirror sitemaps so the old
  // URLs (sitemap-google.xml / sitemap-v3.xml) go away and return 404.
  for (const legacy of ['sitemap-google.xml', 'sitemap-v3.xml']) {
    const lp = path.join(frontendDir, legacy);
    if (fs.existsSync(lp)) { try { fs.unlinkSync(lp); } catch (e) { /* ignore */ } }
  }
  console.log('[sitemap] wrote', filePath, `(${(products || []).length} products, ${(generateSitemapXML.BLOG_IDS || []).length} blogs)`);
}

// Write a real static sitemap.xml on startup. Google Search Console is more
// reliable with an actual file on disk than with a dynamic route.
writeSitemapFile(DOMAIN, loadProducts());

// Build a normalized variant key from the item stored in the cart/order.
function variantKey(item) {
  if (!item || !item.variant) return '';
  // Support both old "Name:Value" strings and future structured objects.
  if (typeof item.variant === 'string') return item.variant;
  if (typeof item.variant === 'object') {
    return Object.entries(item.variant).map(([k, v]) => `${k}:${v}`).sort().join('|');
  }
  return '';
}

// Return available stock for a specific product variant. Falls back to the product's base stock
// when per-variant inventory has not been configured yet (backward compatible).
function getVariantStock(product, vKey) {
  if (!product || !vKey) return Number(product?.stock) || 0;
  const map = product.variantStock || {};
  if (map[vKey] != null) return Number(map[vKey]) || 0;
  // Also try legacy "Name:Value" style if stored differently.
  const normalized = String(vKey).split('|').sort().join('|');
  if (map[normalized] != null) return Number(map[normalized]) || 0;
  return Number(product.stock) || 0;
}

function getProductStock(id) {
  const p = loadProducts().find(x => x.id === id);
  return p ? Number(p.stock) : null;
}

// Check whether the requested cart quantities can be fulfilled. Returns { ok, shortfalls }.
function checkStock(items) {
  const products = loadProducts();
  const shortfalls = [];
  for (const item of (items || [])) {
    const p = products.find(x => x.id === item.id);
    if (!p) continue;
    const vKey = variantKey(item);
    const available = getVariantStock(p, vKey);
    const requested = Number(item.qty) || 1;
    if (available < requested) {
      shortfalls.push({
        id: item.id,
        name: item.name || p.name,
        variant: vKey,
        requested,
        available,
      });
    }
  }
  return { ok: shortfalls.length === 0, shortfalls };
}

function decrementStock(items) {
  const products = loadProducts();
  let changed = false;
  for (const item of (items || [])) {
    const p = products.find(x => x.id === item.id);
    if (!p) continue;
    const qty = Number(item.qty) || 1;
    const vKey = variantKey(item);
    if (p.variantStock && vKey && p.variantStock[vKey] != null) {
      p.variantStock[vKey] = Math.max(0, (Number(p.variantStock[vKey]) || 0) - qty);
      changed = true;
    } else {
      // Fallback to base stock when per-variant inventory is not configured.
      p.stock = Math.max(0, (Number(p.stock) || 0) - qty);
      changed = true;
    }
  }
  if (changed) saveProducts(products);
  return changed;
}

function restoreStock(items) {
  const products = loadProducts();
  let changed = false;
  for (const item of (items || [])) {
    const p = products.find(x => x.id === item.id);
    if (!p) continue;
    const qty = Number(item.qty) || 1;
    const vKey = variantKey(item);
    if (p.variantStock && vKey && p.variantStock[vKey] != null) {
      p.variantStock[vKey] = (Number(p.variantStock[vKey]) || 0) + qty;
      changed = true;
    } else {
      p.stock = (Number(p.stock) || 0) + qty;
      changed = true;
    }
  }
  if (changed) saveProducts(products);
  return changed;
}

// ===== Coupon Storage (JSON file based) =====
const COUPONS_FILE = path.join(__dirname, 'coupons.json');

function loadCoupons() {
  try {
    if (fs.existsSync(COUPONS_FILE)) {
      return JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf8'));
    }
  } catch (e) { console.error('Error loading coupons:', e.message); }
  return [];
}

function saveCoupons(coupons) {
  fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2));
}

// Resolve & validate a coupon. Returns { ok, discount, coupon, message }.
function resolveCoupon(code, email, subtotal) {
  const raw = String(code || '').trim().toUpperCase();
  if (!raw) return { ok: false, discount: 0, message: 'No coupon code' };
  const coupon = loadCoupons().find(c => c.code.toUpperCase() === raw);
  if (!coupon) return { ok: false, discount: 0, message: 'Invalid coupon code' };
  if (coupon.active === false) return { ok: false, discount: 0, message: 'This coupon is no longer active' };
  const sub = Number(subtotal) || 0;
  if (coupon.minSubtotal && sub < Number(coupon.minSubtotal)) {
    return { ok: false, discount: 0, message: `Minimum subtotal $${coupon.minSubtotal} required` };
  }
  if (coupon.firstOrderOnly) {
    const emailKey = String(email || '').trim().toLowerCase();
    const prior = loadOrders().some(o => (o.customer?.email || '').toLowerCase() === emailKey && o.status !== 'pending_payment' && o.status !== 'expired');
    if (prior) return { ok: false, discount: 0, message: 'This first-order coupon has already been used' };
  }
  let discount = 0;
  if (coupon.type === 'percent') {
    discount = Math.round(sub * (Number(coupon.value) / 100) * 100) / 100;
  } else if (coupon.type === 'fixed') {
    discount = Math.min(sub, Number(coupon.value) || 0);
  }
  discount = Math.round(discount * 100) / 100;
  return { ok: true, discount, coupon, message: `Coupon ${coupon.code} applied` };
}

// ===== Email Module (configurable via .env) =====
let mailer = null;
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@aurae.shop';
function initMailer() {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
    try {
      const nodemailer = require('nodemailer');
      mailer = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      console.log('[Email] SMTP configured (' + process.env.EMAIL_HOST + ')');
    } catch (e) {
      console.warn('[Email] nodemailer unavailable, running in dev log mode:', e.message);
    }
  } else {
    console.warn('[Email] No SMTP configured — running in dev log mode (emails printed to console).');
  }
}
initMailer();
startAbandonedCartJob();

async function sendEmail({ to, subject, html, text }) {
  const body = text || (html ? html.replace(/<[^>]+>/g, '') : '');
  if (!to) return { error: 'no recipient' };
  if (!mailer) {
    console.log(`[Email][DEV] -> to=${to} | subject="${subject}"\n${body}`);
    return { dev: true };
  }
  try {
    await mailer.sendMail({ from: EMAIL_FROM, to, subject, html, text: body });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return { sent: true };
  } catch (e) {
    console.error('[Email] Send failed:', e.message);
    return { error: e.message };
  }
}

// ===== Abandoned Cart Recovery =====
// When a shopper reaches checkout but doesn't complete payment, we keep their
// cart and send a gentle recovery email after a configurable delay.
const ABANDONED_CARTS_FILE = path.join(__dirname, 'abandoned-carts.json');
function loadAbandonedCarts() {
  try { if (fs.existsSync(ABANDONED_CARTS_FILE)) return JSON.parse(fs.readFileSync(ABANDONED_CARTS_FILE, 'utf8')); } catch (e) { console.error('Error loading abandoned carts:', e.message); }
  return [];
}
function saveAbandonedCarts(list) { fs.writeFileSync(ABANDONED_CARTS_FILE, JSON.stringify(list, null, 2)); }

// Mark any open abandoned cart for this email as converted so we stop emailing.
function markAbandonedConverted(email) {
  if (!email) return;
  const key = String(email).trim().toLowerCase();
  const carts = loadAbandonedCarts();
  let changed = false;
  for (const c of carts) {
    if (c.email === key && !c.converted) { c.converted = true; changed = true; }
  }
  if (changed) saveAbandonedCarts(carts);
}

function emailAbandonedCart(cart) {
  const domain = process.env.DOMAIN || 'https://www.aurae.asia';
  const checkoutUrl = domain + '/index.html?view=checkout';
  const itemsHtml = (cart.items || []).map(i =>
    `<div style="display:flex;gap:12px;align-items:center;padding:8px 0;border-bottom:1px solid #eee;">
      ${i.image ? `<img src="${escapeHtmlServer(i.image)}" width="48" height="48" style="border-radius:8px;object-fit:cover;">` : ''}
      <div>${escapeHtmlServer(i.name)}${i.variant ? ' (' + escapeHtmlServer(i.variant) + ')' : ''} &times; ${i.qty || 1}</div>
    </div>`).join('');
  return sendEmail({
    to: cart.email,
    subject: `🌙 You left something beautiful behind at Aurae`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#2a2a2a;">
      <h2 style="font-family:'Cormorant Garamond',serif;">Your crystals are waiting 💎</h2>
      <p>Hi ${escapeHtmlServer(cart.name || 'Beautiful Soul')}, you started checking out but didn't finish — your cart is safely saved:</p>
      <div style="background:#f8f5f0;border-radius:12px;padding:16px;margin:16px 0;">${itemsHtml}</div>
      <p>Complete your order and enjoy <strong>10% off your first order</strong> with code <strong>CRYSTAL10</strong> at checkout.</p>
      <a href="${checkoutUrl}" style="display:inline-block;background:#2a2a2a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:8px 0;">Return to my cart</a>
      <p style="color:#888;font-size:12px;">This is a friendly reminder about items you added to your cart. If you'd rather not receive these, just ignore this email.</p>
    </div>`,
  });
}

// Periodic job: email open carts that have aged past the first/reminder delay.
function startAbandonedCartJob() {
  if (!mailer) { console.log('[AbandonedCart] SMTP not configured — recovery emails disabled.'); return; }
  const FIRST_DELAY = (Number(process.env.ABANDONED_CART_FIRST_DELAY_HOURS) || 1) * 3600 * 1000;
  const REMINDER_DELAY = (Number(process.env.ABANDONED_CART_REMINDER_DELAY_HOURS) || 24) * 3600 * 1000;
  let MAX_REMINDERS = Number(process.env.ABANDONED_CART_MAX_REMINDERS);
  if (!MAX_REMINDERS || MAX_REMINDERS < 0) MAX_REMINDERS = 1;
  const PRUNE_AGE = 30 * 24 * 3600 * 1000;

  const run = () => {
    try {
      const carts = loadAbandonedCarts();
      if (!carts.length) return;
      const now = Date.now();
      let changed = false;
      const next = [];
      for (const c of carts) {
        const age = now - new Date(c.createdAt).getTime();
        if (c.converted) {
          if (age > PRUNE_AGE) { changed = true; continue; }
          next.push(c);
          continue;
        }
        if (c.reminders < MAX_REMINDERS && (c.reminders === 0 ? age >= FIRST_DELAY : age >= REMINDER_DELAY)) {
          emailAbandonedCart(c);
          c.emailed = true;
          c.lastEmailedAt = new Date().toISOString();
          c.reminders = (c.reminders || 0) + 1;
          changed = true;
        } else if (c.reminders >= MAX_REMINDERS && age > PRUNE_AGE) {
          changed = true; // prune fully-reminded carts after 30 days
          continue;
        }
        next.push(c);
      }
      if (changed) saveAbandonedCarts(next);
    } catch (e) {
      console.error('[AbandonedCart] job error:', e.message);
    }
  };
  setInterval(run, 15 * 60 * 1000); // every 15 minutes
  console.log('[AbandonedCart] recovery job started (first delay=' + (Number(process.env.ABANDONED_CART_FIRST_DELAY_HOURS) || 1) + 'h, max reminders=' + MAX_REMINDERS + ')');
}

function emailOrderConfirmation(order) {
  const itemsHtml = (order.items || []).map(i =>
    `<div>${i.qty || 1}&times; ${i.name} &mdash; $${(i.price * (i.qty || 1)).toFixed(2)}</div>`).join('');
  const t = order.totals || {};
  return sendEmail({
    to: order.customer?.email,
    subject: `Aurae — Order Confirmed (#${order.orderId})`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#2a2a2a;">
      <h2 style="font-family:'Cormorant Garamond',serif;">Thank you for your order 🌙</h2>
      <p>Hi ${order.customer?.name || 'Beautiful Soul'}, your payment was received and your crystals are being cleansed and activated.</p>
      <div style="background:#f8f5f0;border-radius:12px;padding:16px;margin:16px 0;">${itemsHtml}
        <hr style="border:none;border-top:1px solid #e8e0d8;margin:12px 0;">
        <div>Subtotal: $${t.subtotal?.toFixed(2)}</div>
        ${t.discount ? `<div>Discount: -$${t.discount.toFixed(2)}</div>` : ''}
        <div>Shipping: ${t.shipping ? '$' + t.shipping.toFixed(2) : 'FREE'}</div>
        <div>Tax: $${t.tax?.toFixed(2)}</div>
        <div style="font-weight:700;">Total: $${t.total?.toFixed(2)}</div>
      </div>
      <p>You'll receive a tracking number by email once your order ships (within 24&ndash;48 hours).</p>
      <p style="color:#888;font-size:12px;">Order #${order.orderId}</p>
    </div>`,
  });
}

function emailShippingNotification(order) {
  return sendEmail({
    to: order.customer?.email,
    subject: `Aurae — Your order has shipped (#${order.orderId})`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#2a2a2a;">
      <h2 style="font-family:'Cormorant Garamond',serif;">Your crystals are on the way ✨</h2>
      <p>Hi ${order.customer?.name || 'Beautiful Soul'}, your order #${order.orderId} has shipped.</p>
      <p><strong>Carrier:</strong> ${order.carrier || 'Standard Shipping'}<br>
      <strong>Tracking Number:</strong> ${order.trackingNumber || 'N/A'}</p>
      <p>Estimated delivery: ${order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-US') : 'within 7 days'}.</p>
    </div>`,
  });
}

function emailReplyNotification(message) {
  return sendEmail({
    to: message.email,
    subject: `Aurae — Reply to your message`,
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#2a2a2a;">
      <h2 style="font-family:'Cormorant Garamond',serif;">We've replied to your message</h2>
      <p>Hi ${message.name || 'there'}, thank you for reaching out. Here is our reply to "<strong>${message.subject}</strong>":</p>
      <div style="background:#f8f5f0;border-radius:12px;padding:16px;margin:16px 0;white-space:pre-wrap;">${(message.replies && message.replies[message.replies.length - 1].reply) || ''}</div>
      <p style="color:#888;font-size:12px;">Aurae Customer Care</p>
    </div>`,
  });
}

// Notify the store owner when a real (paid) order comes in.
function emailOwnerNewOrder(order) {
  const ownerEmail = process.env.ADMIN_NOTIFY_EMAIL;
  if (!ownerEmail) {
    console.warn('[Email] ADMIN_NOTIFY_EMAIL not set — skipping owner new-order notification.');
    return;
  }
  const t = order.totals || {};
  const itemsHtml = (order.items || []).map(i =>
    `<div>${i.qty || 1}&times; ${(i.name || '')}${i.variant ? ' (' + i.variant + ')' : ''} &mdash; $${(i.price * (i.qty || 1)).toFixed(2)}</div>`
  ).join('');
  const addr = order.customer?.address || {};
  const addressLine = [addr.line1, addr.line2, addr.city, addr.state, addr.zip, addr.country]
    .filter(Boolean).join(', ') || '—';
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#2a2a2a;">
    <h2 style="font-family:'Cormorant Garamond',serif;color:#8a6d4b;">🌟 New order received — #${order.orderId}</h2>
    <p>A customer just placed a <strong>paid</strong> order on Aurae. Here are the details:</p>
    <div style="background:#f8f5f0;border-radius:12px;padding:16px;margin:16px 0;">
      <div style="margin-bottom:10px;"><strong>Customer:</strong> ${order.customer?.name || '—'} ${order.customer?.phone ? '(' + order.customer.phone + ')' : ''}</div>
      <div style="margin-bottom:10px;"><strong>Email:</strong> ${order.customer?.email || '—'}</div>
      <div style="margin-bottom:10px;"><strong>Ship to:</strong> ${addressLine}</div>
      <div style="margin-bottom:10px;"><strong>Payment:</strong> ${order.paymentProvider || '—'}${order.coupon ? ' · coupon ' + order.coupon : ''}</div>
      <hr style="border:none;border-top:1px solid #e8e0d8;margin:12px 0;">
      ${itemsHtml}
      <hr style="border:none;border-top:1px solid #e8e0d8;margin:12px 0;">
      <div>Subtotal: $${t.subtotal?.toFixed(2)}</div>
      ${t.discount ? `<div>Discount: -$${t.discount.toFixed(2)}</div>` : ''}
      <div>Shipping: ${t.shipping ? '$' + t.shipping.toFixed(2) : 'FREE'}</div>
      <div>Tax: $${t.tax?.toFixed(2)}</div>
      <div style="font-weight:700;font-size:16px;">Total: $${t.total?.toFixed(2)} ${t.currency || ''}</div>
    </div>
    <p style="color:#888;font-size:12px;">View in admin: ${process.env.DOMAIN || ''}/admin.html &middot; Order #${order.orderId}</p>
  </div>`;
  return sendEmail({
    to: ownerEmail,
    subject: `🌟 New Aurae order #${order.orderId} — $${t.total?.toFixed(2) || '0'}`,
    html,
  });
}

// Finalize a paid order: decrement inventory + send confirmation email + bump coupon usage.
function finalizePaidOrder(orderId) {
  const orders = loadOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;
  markAbandonedConverted(order.customer?.email); // stop any pending recovery email
  decrementStock(order.items || []);
  if (order.coupon) {
    const coupons = loadCoupons();
    const c = coupons.find(x => x.code.toUpperCase() === String(order.coupon).toUpperCase());
    if (c) { c.usedCount = (c.usedCount || 0) + 1; saveCoupons(coupons); }
  }
  emailOrderConfirmation(order);
  emailOwnerNewOrder(order); // notify store owner of the new paid order
}

// ===== Helper: Build a tracking timeline from order status =====
function addDaysISO(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildTracking(order) {
  const created = new Date(order.createdAt || Date.now());
  const isPaid = ['paid', 'shipped', 'delivered'].includes(order.status);
  const isShipped = order.status === 'shipped' || order.status === 'delivered';
  const isDelivered = order.status === 'delivered';
  const hasPayment = isPaid || !!order.paidAt;
  const carrier = order.carrier || 'Standard Shipping';
  const trackingNumber = order.trackingNumber || null;
  const fmt = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const steps = [
    {
      title: 'Order Placed',
      time: fmt(created),
      description: 'We received your order and are preparing it with care.',
    },
    {
      title: 'Payment Confirmed',
      time: hasPayment ? fmt(order.paidAt || created) : 'Pending',
      description: hasPayment ? 'Your payment was successfully processed.' : 'Waiting for payment confirmation.',
    },
    {
      title: 'Crystals Cleansed & Activated',
      time: hasPayment ? fmt(order.activatedAt || addDaysISO(created, 1)) : 'Estimated after payment',
      description: 'Your crystals are being energetically cleansed and charged.',
    },
    {
      title: 'Shipped',
      time: isShipped ? fmt(order.shippedAt || addDaysISO(created, 2)) : 'Estimated ' + fmt(addDaysISO(created, 2)),
      description: isShipped
        ? (trackingNumber ? `Your package has left our studio via ${carrier}. Tracking: ${trackingNumber}` : `Your package has left our studio via ${carrier}.`)
        : 'We will email you a tracking number once shipped.',
    },
    {
      title: 'Out for Delivery',
      time: isDelivered ? fmt(addDaysISO(created, 5)) : 'Estimated ' + fmt(addDaysISO(created, 5)),
      description: 'Your crystals are on the final leg of their journey.',
    },
    {
      title: 'Delivered',
      time: isDelivered ? fmt(order.deliveredAt || addDaysISO(created, 7)) : 'Estimated ' + fmt(addDaysISO(created, 7)),
      description: 'Your Aurae package has been delivered. Enjoy the energy!',
    },
  ];
  return steps;
}

// ===== Admin Config =====
// `let` (not const) so /api/admin/change-password can rotate the password + token at runtime.
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aurae2026';
let ADMIN_TOKEN = crypto.createHash('sha256').update('aurae-admin-salt:' + ADMIN_PASSWORD).digest('hex');

function recomputeAdminToken() {
  ADMIN_TOKEN = crypto.createHash('sha256').update('aurae-admin-salt:' + ADMIN_PASSWORD).digest('hex');
}

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.body?.token || req.query.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized. Please log in as admin.' });
  }
  next();
}

// ===== Customer Auth (JWT) =====
// Never fall back to a predictable secret. If JWT_SECRET is missing (or is the
// public placeholder shipped in .env.example) we generate a strong random one
// and persist it to .env so it survives restarts.
const JWT_PLACEHOLDER = 'change-me-to-a-long-random-string';
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === JWT_PLACEHOLDER) {
  const generated = crypto.randomBytes(32).toString('hex');
  try {
    const envPath = path.join(__dirname, '.env');
    const cur = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    const next = cur.includes('JWT_SECRET=')
      ? cur.replace(/^JWT_SECRET=.*$/m, 'JWT_SECRET=' + generated)
      : cur + `\nJWT_SECRET=${generated}\n`;
    fs.writeFileSync(envPath, next);
    console.warn('[SECURITY] JWT_SECRET was missing/weak - generated and saved a strong random secret to .env.');
  } catch (e) {
    // If we cannot persist, still use the strong secret for this run.
    console.warn('[SECURITY] JWT_SECRET missing/weak and could not be persisted; using an in-memory secret for this run:', e.message);
  }
  JWT_SECRET = generated;
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req.headers['x-auth-token'] || '');
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

// ===== Helper: Calculate order totals =====
function calculateTotals(items, couponCode = '', email = '') {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 50 ? 0 : 5.99;
  let discount = 0;
  const code = String(couponCode || '').trim();
  if (code) {
    const r = resolveCoupon(code, email, subtotal);
    discount = r.ok ? r.discount : 0;
  }
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * 0.08 * 100) / 100;
  const total = Math.round((taxable + shipping + tax) * 100) / 100;
  return { subtotal, shipping, tax, discount, total };
}

function generateOrderId() {
  return 'CM' + Date.now().toString().slice(-8) + crypto.randomInt(100, 999);
}

// ===== API: Health Check =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    stripe: stripe ? 'configured' : 'not configured',
    paypal: process.env.PAYPAL_CLIENT_ID ? 'configured' : 'not configured',
    paypalMode: process.env.PAYPAL_MODE || 'sandbox',
    paypalWebhook: process.env.PAYPAL_WEBHOOK_ID ? 'configured' : 'not configured',
  });
});

// ===== API: Get Publishable Key (for frontend Stripe.js) =====
app.get('/api/config', (req, res) => {
  res.json({
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
    paypalMode: process.env.PAYPAL_MODE || 'sandbox',
  });
});

// ===== API: Submit Contact Message =====
app.post('/api/contact', publicLimiter, (req, res) => {
  try {
    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Please fill in all fields (name, email, subject, message).' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const entry = {
      id: 'MSG' + Date.now().toString().slice(-8) + crypto.randomInt(100, 999),
      name: String(name).slice(0, 200),
      email: String(email).slice(0, 200),
      subject: String(subject).slice(0, 200),
      message: String(message).slice(0, 5000),
      createdAt: new Date().toISOString(),
      status: 'new',
      replies: [],
    };

    saveMessage(entry);
    res.json({ success: true, message: "Thank you for reaching out. We'll get back to you within 24 hours." });
  } catch (error) {
    console.error('[Contact] Error saving message:', error.message);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

// ===== API: Reviews — Get reviews for a product =====
app.get('/api/reviews/:productId', (req, res) => {
  const productId = req.params.productId;
  const all = loadReviews().filter(r => r.productId === productId && r.status === 'approved');
  const count = all.length;
  const averageRating = count
    ? Math.round((all.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10
    : 0;
  res.json({ productId, reviews: all, count, averageRating });
});

// ===== API: Reviews — Submit a review (with optional photos, pending moderation) =====
app.post('/api/reviews', publicLimiter, reviewUpload.array('images', 5), (req, res) => {
  try {
    const { productId, name, email, rating, title, comment, userId, userEmail } = req.body || {};
    if (!productId || !name || !email || !comment) {
      return res.status(400).json({ error: 'Please fill in all required fields (name, email, comment).' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const r = Number(rating);
    if (!r || r < 1 || r > 5) {
      return res.status(400).json({ error: 'Please select a rating between 1 and 5 stars.' });
    }
    const images = (req.files || []).map(f => '/uploads/reviews/' + f.filename);
    const entry = {
      id: 'REV' + Date.now().toString().slice(-8) + crypto.randomInt(100, 999),
      productId: String(productId).slice(0, 50),
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 200),
      userId: userId || null,
      userEmail: userEmail || null,
      rating: r,
      title: String(title || '').slice(0, 200),
      comment: String(comment).slice(0, 3000),
      images,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    saveReview(entry);
    res.json({ success: true, review: entry, message: 'Your review has been submitted and is awaiting approval.' });
  } catch (error) {
    console.error('[Review] Error saving review:', error.message);
    res.status(500).json({ error: 'Failed to submit review. Please try again later.' });
  }
});

// ===== API: Track an order (by orderId + email) =====
app.get('/api/track', (req, res) => {
  const orderId = String(req.query.orderId || '').trim();
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!orderId || !email) {
    return res.status(400).json({ error: 'Order ID and email are required.' });
  }
  const orders = loadOrders();
  const order = orders.find(o => o.orderId === orderId && (o.customer?.email || '').toLowerCase() === email);
  if (!order) {
    return res.status(404).json({ error: 'No matching order found. Please check your Order ID and email.' });
  }
  res.json({
    success: true,
    order: {
      orderId: order.orderId,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt || null,
      customer: { name: order.customer?.name, email: order.customer?.email },
      items: order.items,
      total: order.total ?? order.totals?.total,
      estimatedDelivery: order.estimatedDelivery || addDaysISO(order.createdAt || Date.now(), 7),
      carrier: order.carrier || 'Standard Shipping',
      trackingNumber: order.trackingNumber || null,
      tracking: buildTracking(order),
    },
  });
});

// ===== API: Admin — Login =====
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true, token: ADMIN_TOKEN });
  }
  return res.status(401).json({ error: 'Invalid admin password.' });
});

// ===== API: Admin — Change admin password =====
// Rotates the password both in-memory (so the running process picks it up immediately)
// and persisted into the .env file (so it survives a restart). Returns a fresh token.
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  const { newPassword } = req.body || {};
  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' });
  }
  try {
    ADMIN_PASSWORD = newPassword;
    recomputeAdminToken();
    // Persist to .env so a restart keeps the new password.
    const envPath = path.join(__dirname, '.env');
    let envText = '';
    try { envText = fs.readFileSync(envPath, 'utf8'); } catch (e) { envText = ''; }
    const line = 'ADMIN_PASSWORD=' + ADMIN_PASSWORD;
    if (/^[ \t]*ADMIN_PASSWORD[ \t]*=/m.test(envText)) {
      envText = envText.replace(/^[ \t]*ADMIN_PASSWORD[ \t]*=.*$/m, line);
    } else {
      envText = envText.replace(/\s*$/, '') + '\n' + line + '\n';
    }
    fs.writeFileSync(envPath, envText);
    console.log('[Admin] Password changed and persisted to .env');
    res.json({ success: true, token: ADMIN_TOKEN });
  } catch (e) {
    console.error('[Admin] Change password failed:', e.message);
    res.status(500).json({ error: 'Failed to change password. Please try again.' });
  }
});

// ===== API: Admin — List Messages =====
app.get('/api/admin/messages', requireAdmin, (req, res) => {
  const messages = loadMessages().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ messages });
});

// ===== API: Admin — Reply to a Message =====
app.post('/api/admin/messages/:id/reply', requireAdmin, (req, res) => {
  const { reply } = req.body || {};
  if (!reply || !String(reply).trim()) {
    return res.status(400).json({ error: 'Reply cannot be empty.' });
  }
  const messages = loadMessages();
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx < 0) {
    return res.status(404).json({ error: 'Message not found.' });
  }
  const replyEntry = {
    id: 'REP' + Date.now().toString().slice(-8) + crypto.randomInt(100, 999),
    by: 'admin',
    reply: String(reply).slice(0, 5000),
    createdAt: new Date().toISOString(),
  };
  messages[idx].replies = messages[idx].replies || [];
  messages[idx].replies.push(replyEntry);
  messages[idx].status = 'replied';
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  console.log(`[Message] Admin replied to ${messages[idx].id}`);
  emailReplyNotification(messages[idx]);
  res.json({ success: true, message: messages[idx] });
});

// ===== API: Admin — Update Message Status =====
app.post('/api/admin/messages/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const messages = loadMessages();
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Message not found.' });
  messages[idx].status = status || messages[idx].status;
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  res.json({ success: true, message: messages[idx] });
});

// ===== API: Public — Customer views own messages by email =====
app.get('/api/messages', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const messages = loadMessages()
    .filter(m => m.email && m.email.toLowerCase() === email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ messages });
});

// ===== API: Create Stripe Checkout Session =====
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in .env' });
    }

    const { items, customer, coupon } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const totals = calculateTotals(items, coupon, customer?.email);

    // Reserve / verify inventory before allowing payment.
    const stockCheck = checkStock(items);
    if (!stockCheck.ok) {
      const names = stockCheck.shortfalls.map(s => `${s.name}${s.variant ? ' (' + s.variant + ')' : ''}: ${s.requested} requested, ${s.available} available`).join('; ');
      return res.status(409).json({ error: 'Some items are no longer in stock: ' + names, shortfalls: stockCheck.shortfalls });
    }

    const orderId = generateOrderId();

    // Build Stripe line items
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.tagline || '',
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100), // Stripe uses cents
      },
      quantity: item.qty,
    }));

    // Add shipping line item if applicable
    if (totals.shipping > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Shipping' },
          unit_amount: Math.round(totals.shipping * 100),
        },
        quantity: 1,
      });
    }

    // Add discount line item if applicable
    if (totals.discount > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { name: 'Discount (CRYSTAL10)' },
          unit_amount: -Math.round(totals.discount * 100),
        },
        quantity: 1,
      });
    }

    // Add tax line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Tax (8%)' },
        unit_amount: Math.round(totals.tax * 100),
      },
      quantity: 1,
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      // To enable Apple Pay / Google Pay, add: 'apple_pay', 'google_pay'
      // and ensure your domain is registered in Stripe Dashboard
      line_items: lineItems,
      mode: 'payment',
      success_url: `${DOMAIN}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${DOMAIN}/checkout-cancel.html?order_id=${orderId}`,
      customer_email: customer?.email || undefined,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'NL', 'IT', 'ES', 'JP', 'SG'],
      },
      metadata: {
        orderId,
        customerName: customer?.name || '',
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || '',
      },
      custom_text: {
        submit: {
          message: 'Your crystals will be activated and shipped within 24-48 hours.',
        },
      },
    });

    // Save pending order
    saveOrder({
      orderId,
      paymentProvider: 'stripe',
      stripeSessionId: session.id,
      items,
      customer: customer || {},
      userId: (customer && customer.userId) || req.body.userId || null,
      userEmail: (customer && customer.email) || req.body.userEmail || null,
      totals,
      coupon: coupon || null,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
    });

    console.log(`[Stripe] Session created: ${session.id} for order ${orderId} - $${totals.total}`);

    res.json({
      sessionId: session.id,
      url: session.url,
      orderId,
    });

  } catch (error) {
    console.error('[Stripe] Error creating session:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== API: Stripe Webhook =====
async function handleStripeWebhook(req, res) {
  if (!stripe) {
    return res.status(503).send('Stripe not configured');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  // Fail closed: never trust an unverified webhook body. Accepting unverified
  // events would let an attacker forge "payment succeeded" and get free orders.
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[Stripe Webhook] Missing signature or webhook secret - refusing event.');
    return res.status(400).send('Webhook signature/secret not configured.');
  }

  try {
    event = stripe.webhooks.constructEvent(req.rawBody || req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      
      if (orderId) {
        updateOrder(orderId, {
          status: 'paid',
          stripePaymentIntentId: session.payment_intent,
          paidAt: new Date().toISOString(),
          paymentAmount: session.amount_total / 100,
          shippingAddress: session.shipping_details || null,
          customerEmail: session.customer_email || session.metadata?.customerEmail,
        });
        console.log(`[Stripe Webhook] Payment confirmed for order ${orderId}`);
        finalizePaidOrder(orderId); // decrement stock + send confirmation email + bump coupon
        // TODO: Notify 1688 supplier to ship the order
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        updateOrder(orderId, { status: 'expired' });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.error(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);
      break;
    }

    default:
      // Unhandled event type
  }

  res.json({ received: true });
}

// ===== API: PayPal Webhook =====
// PayPal sends async events (payment captured, refunded, etc.). We verify the
// signature with PayPal's verify-webhook-signature endpoint before trusting it.
// Fail closed: an unverified event must never mark an order as paid.
async function handlePayPalWebhook(req, res) {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return res.status(503).send('PayPal not configured');
  }
  if (!process.env.PAYPAL_WEBHOOK_ID) {
    console.error('[PayPal Webhook] PAYPAL_WEBHOOK_ID not set - refusing event.');
    return res.status(400).send('Webhook ID not configured.');
  }

  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const transmissionSig = req.headers['paypal-transmission-sig'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    console.error('[PayPal Webhook] Missing verification headers.');
    return res.status(400).send('Missing PayPal verification headers.');
  }

  let event;
  try {
    event = JSON.parse((req.rawBody || req.body || '').toString('utf8'));
  } catch (e) {
    console.error('[PayPal Webhook] Invalid JSON body.');
    return res.status(400).send('Invalid JSON.');
  }

  // Verify the event signature with PayPal
  try {
    const accessToken = await getPayPalAccessToken();
    const verifyRes = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: event,
      }),
    });
    const verifyData = await verifyRes.json();
    if (verifyData.verification_status !== 'SUCCESS') {
      console.error('[PayPal Webhook] Signature verification failed:', JSON.stringify(verifyData));
      return res.status(400).send('Webhook signature verification failed.');
    }
  } catch (err) {
    console.error('[PayPal Webhook] Verification request error:', err.message);
    return res.status(500).send('Verification error.');
  }

  console.log(`[PayPal Webhook] Event: ${event.event_type}`);

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const ppOrderId = event.resource?.supplementary_data?.related_ids?.order_id || null;
    const captureId = event.resource?.id;
    const amount = event.resource?.amount?.value;
    const orders = loadOrders();
    const order = orders.find(o => o.paypalOrderId === ppOrderId);
    if (order) {
      if (order.status !== 'paid') {
        updateOrder(order.orderId, {
          status: 'paid',
          paypalCaptureId: captureId,
          paidAt: new Date().toISOString(),
          paymentAmount: parseFloat(amount || order.totals?.total || 0),
        });
        finalizePaidOrder(order.orderId); // decrement stock + send confirmation email + bump coupon
        console.log(`[PayPal Webhook] Payment confirmed for order ${order.orderId}`);
      } else {
        console.log(`[PayPal Webhook] Order ${order.orderId} already paid - skipping.`);
      }
    } else {
      console.error(`[PayPal Webhook] No matching order for PayPal order ${ppOrderId}`);
    }
  } else if (event.event_type === 'PAYMENT.CAPTURE.REFUNDED' || event.event_type === 'PAYMENT.CAPTURE.REVERSED') {
    const ppOrderId = event.resource?.supplementary_data?.related_ids?.order_id;
    const orders = loadOrders();
    const order = orders.find(o => o.paypalOrderId === ppOrderId);
    if (order) {
      updateOrder(order.orderId, { status: 'refunded' });
      console.log(`[PayPal Webhook] Order ${order.orderId} marked refunded.`);
    }
  }

  res.json({ received: true });
}

// ===== API: Create PayPal Order =====
app.post('/api/create-paypal-order', async (req, res) => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID) {
      return res.status(503).json({ error: 'PayPal is not configured. Please set PAYPAL_CLIENT_ID in .env' });
    }

    const { items, customer, coupon } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const totals = calculateTotals(items, coupon, customer?.email);

    // Reserve / verify inventory before allowing payment.
    const stockCheck = checkStock(items);
    if (!stockCheck.ok) {
      const names = stockCheck.shortfalls.map(s => `${s.name}${s.variant ? ' (' + s.variant + ')' : ''}: ${s.requested} requested, ${s.available} available`).join('; ');
      return res.status(409).json({ error: 'Some items are no longer in stock: ' + names, shortfalls: stockCheck.shortfalls });
    }

    const orderId = generateOrderId();
    const accessToken = await getPayPalAccessToken();

    // Build PayPal amount breakdown (only include discount when applicable)
    const breakdown = {
      item_total: {
        currency_code: 'USD',
        value: totals.subtotal.toFixed(2),
      },
      shipping: {
        currency_code: 'USD',
        value: totals.shipping.toFixed(2),
      },
      tax_total: {
        currency_code: 'USD',
        value: totals.tax.toFixed(2),
      },
    };
    if (totals.discount > 0) {
      breakdown.discount = {
        currency_code: 'USD',
        value: totals.discount.toFixed(2),
      };
    }

    // Create PayPal order
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          description: 'Aurae Crystal Jewelry Order',
          amount: {
            currency_code: 'USD',
            value: totals.total.toFixed(2),
            breakdown,
          },
          items: items.map(item => ({
            name: item.name,
            description: item.tagline || 'Crystal jewelry',
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2),
            },
            quantity: String(item.qty),
          })),
          shipping: customer?.name ? {
            name: { full_name: customer.name },
            address: {
              address_line_1: customer.address || '',
              admin_area_2: customer.city || '',
              admin_area_1: customer.state || '',
              postal_code: customer.zip || '',
              country_code: 'US',
            },
          } : undefined,
        },
      ],
      application_context: {
        brand_name: 'Aurae',
        landing_page: 'NO_PREFERENCE',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'PAY_NOW',
        return_url: `${DOMAIN}/payment-success.html?provider=paypal&order_id=${orderId}`,
        cancel_url: `${DOMAIN}/checkout-cancel.html?order_id=${orderId}`,
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(paypalOrder),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[PayPal] Order creation failed:', JSON.stringify(error));
      throw new Error(error.message || 'PayPal order creation failed');
    }

    const paypalData = await response.json();

    // Save pending order
    saveOrder({
      orderId,
      paymentProvider: 'paypal',
      paypalOrderId: paypalData.id,
      items,
      customer: customer || {},
      userId: (customer && customer.userId) || req.body.userId || null,
      userEmail: (customer && customer.email) || req.body.userEmail || null,
      totals,
      coupon: coupon || null,
      status: 'pending_payment',
      createdAt: new Date().toISOString(),
    });

    console.log(`[PayPal] Order created: ${paypalData.id} for order ${orderId} - $${totals.total}`);

    res.json({
      paypalOrderId: paypalData.id,
      orderId,
      approveUrl: paypalData.links?.find(l => l.rel === 'approve')?.href,
    });

  } catch (error) {
    console.error('[PayPal] Error creating order:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== API: Capture PayPal Order =====
app.post('/api/capture-paypal-order', async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;

    if (!paypalOrderId) {
      return res.status(400).json({ error: 'paypalOrderId is required' });
    }

    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('[PayPal] Capture failed:', JSON.stringify(error));
      throw new Error(error.message || 'PayPal capture failed');
    }

    const captureData = await response.json();

    // Update order status
    if (orderId) {
      updateOrder(orderId, {
        status: 'paid',
        paypalCaptureId: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
        paidAt: new Date().toISOString(),
        paymentAmount: parseFloat(captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0'),
      });
      finalizePaidOrder(orderId); // decrement stock + send confirmation email + bump coupon
    }

    console.log(`[PayPal] Payment captured for order ${orderId || paypalOrderId}`);

    res.json({
      status: 'success',
      orderId,
      captureData,
    });

  } catch (error) {
    console.error('[PayPal] Error capturing order:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== API: Get Order Status =====
app.get('/api/order/:orderId', (req, res) => {
  const orders = loadOrders();
  const order = orders.find(o => o.orderId === req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Public success-page view: expose only the fields the receipt/tracking page
  // needs. Full order details (address, phone, capture ids) are available via
  // /api/me/orders for authenticated buyers or /api/admin/orders for staff.
  res.json({
    orderId: order.orderId,
    status: order.status,
    createdAt: order.createdAt,
    paidAt: order.paidAt || null,
    customer: {
      name: order.customer?.name || '',
      email: order.customer?.email || '',
    },
    customerName: order.customer?.name || '',
    customerEmail: order.customer?.email || '',
    items: (order.items || []).map(item => ({
      name: item.name,
      qty: item.qty ?? item.quantity ?? 1,
      quantity: item.quantity ?? item.qty ?? 1,
      price: item.price,
      image: item.image || '',
    })),
    totals: order.totals || {
      subtotal: order.subtotal || 0,
      shipping: order.shipping || 0,
      tax: order.tax || 0,
      discount: order.discount || 0,
      total: order.total || order.paymentAmount || 0,
    },
    amount: order.paymentAmount || order.total || 0,
    paymentMethod: order.paymentMethod || '',
  });
});

// ===== API: Get Stripe Session Details (for success page) =====
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId, {
      expand: ['line_items', 'customer_details'],
    });

    res.json({
      orderId: session.metadata?.orderId,
      status: session.payment_status,
      amount: session.amount_total / 100,
      customerEmail: session.customer_email,
      customerName: session.metadata?.customerName,
      items: session.line_items?.data.map(li => ({
        name: li.description,
        quantity: li.quantity,
        amount: li.amount_total / 100,
      })),
      shippingAddress: session.shipping_details,
    });
  } catch (error) {
    console.error('[Stripe] Error retrieving session:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== Serve payment result pages =====
app.get('/payment-success.html', (req, res) => {
  res.sendFile(path.join(frontendDir, 'payment-success.html'));
});

app.get('/checkout-cancel.html', (req, res) => {
  res.sendFile(path.join(frontendDir, 'checkout-cancel.html'));
});

// ===== API: Public — List all products (storefront data source) =====
// IMPORTANT: this must be registered BEFORE /api/products/:id, otherwise Express
// interprets '/api/products' as the :id parameter and returns 404.
app.get('/api/products', (req, res) => {
  const products = loadProducts().map(p => ({
    ...p,
    stock: Number(p.stock),
    images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
  }));
  res.json({ products });
});

// ===== API: Public — Product stock (inventory authority) =====
app.get('/api/products/:id', (req, res) => {
  const p = loadProducts().find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json({
    id: p.id,
    name: p.name,
    stock: Number(p.stock),
    variantStock: p.variantStock || {},
  });
});

// ===== API: Public — Validate coupon =====
app.get('/api/validate-coupon', (req, res) => {
  const code = String(req.query.code || '');
  const email = String(req.query.email || '');
  const subtotal = Number(req.query.subtotal || 0);
  const r = resolveCoupon(code, email, subtotal);
  res.json({ ok: r.ok, discount: r.discount, code: r.ok ? r.coupon.code : '', message: r.message });
});

// ===== API: Admin — List Orders =====
app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const orders = loadOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

// ===== API: Admin — Export Orders to CSV =====
app.get('/api/admin/orders/export', requireAdmin, (req, res) => {
  const orders = loadOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const escapeCSV = (val) => {
    const s = String(val == null ? '' : val).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const header = ['Order ID', 'Date', 'Status', 'Customer Name', 'Customer Email', 'Phone', 'Payment Provider', 'Coupon', 'Items', 'Subtotal', 'Discount', 'Shipping', 'Tax', 'Total', 'Currency', 'Address Line 1', 'Address Line 2', 'City', 'State', 'ZIP', 'Country', 'Tracking #', 'Carrier'];
  const rows = orders.map(o => {
    const c = o.customer || {};
    const t = o.totals || {};
    const addr = c.addressObj || {};
    const items = (o.items || []).map(i => `${i.name}${i.variant ? ' [' + i.variant + ']' : ''} x${i.qty} @${(i.price || 0).toFixed(2)}`).join('; ');
    return [
      o.orderId,
      o.createdAt,
      o.status,
      c.name,
      c.email,
      c.phone,
      o.paymentProvider,
      o.coupon || '',
      items,
      (t.subtotal ?? '').toString(),
      (t.discount ?? '').toString(),
      (t.shipping ?? '').toString(),
      (t.tax ?? '').toString(),
      (t.total ?? o.total ?? '').toString(),
      'USD',
      addr.line1 || c.address || '',
      addr.line2 || '',
      addr.city || c.city || '',
      addr.state || c.state || '',
      addr.zip || c.zip || '',
      addr.country || c.country || '',
      o.trackingNumber || '',
      o.carrier || '',
    ].map(escapeCSV).join(',');
  });
  const csv = [header.map(escapeCSV).join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="aurae-orders-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send('\uFEFF' + csv);
});

// ===== API: Admin — Get single Order =====
app.get('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const order = loadOrders().find(o => o.orderId === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

// ===== API: Admin — Update Order status / tracking =====
app.post('/api/admin/orders/:id/status', requireAdmin, (req, res) => {
  const { status, trackingNumber, carrier } = req.body || {};
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  const order = orders[idx];
  const prevStatus = order.status;
  if (status) order.status = status;
  if (trackingNumber !== undefined) order.trackingNumber = String(trackingNumber);
  if (carrier !== undefined) order.carrier = String(carrier);
  if ((status === 'shipped' || (trackingNumber !== undefined && prevStatus === 'shipped')) && prevStatus !== 'delivered') {
    if (!order.shippedAt) order.shippedAt = new Date().toISOString();
    if (!order.estimatedDelivery) order.estimatedDelivery = addDaysISO(Date.now(), 5);
    emailShippingNotification(order);
  }
  if (status === 'delivered') order.deliveredAt = new Date().toISOString();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  console.log(`[Order] Status updated: ${order.orderId} -> ${order.status}${order.trackingNumber ? ' (' + order.trackingNumber + ')' : ''}`);
  res.json({ success: true, order });
});

// ===== API: Admin — Manually mark order as paid (useful when a webhook is missed) =====
app.post('/api/admin/orders/:id/finalize', requireAdmin, (req, res) => {
  const orders = loadOrders();
  const order = orders.find(o => o.orderId === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered') {
    return res.status(400).json({ error: 'Order is already paid or fulfilled.' });
  }
  const stockCheck = checkStock(order.items || []);
  if (!stockCheck.ok) {
    return res.status(409).json({ error: 'Insufficient stock to finalize order.', shortfalls: stockCheck.shortfalls });
  }
  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  finalizePaidOrder(order.orderId);
  res.json({ success: true, order });
});

// ===== API: Admin — Delete Order =====
app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  const removed = orders.splice(idx, 1)[0];
  // Restore inventory for paid/fulfilled orders that had stock deducted.
  if (removed && removed.items && removed.status !== 'pending_payment' && removed.status !== 'expired') {
    restoreStock(removed.items);
  }
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  console.log(`[Order] Deleted: ${removed.orderId}`);
  res.json({ success: true, removed: { orderId: removed.orderId } });
});

// ===== API: Admin — List Users =====
app.get('/api/admin/users', requireAdmin, (req, res) => {
  try {
    const orders = loadOrders();
    const users = loadUsers()
      .filter(u => u && typeof u === 'object')
      .map(u => {
        const id = u.id || '';
        const name = u.name || '';
        const email = (u.email || '').toLowerCase();
        const createdAt = u.createdAt || new Date().toISOString();
        const orderCount = orders.filter(o =>
          (id && o.userId && o.userId === id) ||
          (email && o.userEmail && typeof o.userEmail === 'string' && o.userEmail.toLowerCase() === email)
        ).length;
        return { id, name, email, createdAt, orderCount };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ users });
  } catch (err) {
    console.error('[Admin Users] Error listing users:', err.message);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// ===== API: Admin — Delete User =====
app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  const removed = users.splice(idx, 1)[0];
  saveUsers(users);
  console.log(`[User] Deleted: ${removed.email}`);
  res.json({ success: true, removed: { id: removed.id, email: removed.email } });
});

// ===== API: Admin — List Products (stock) =====
app.get('/api/admin/products', requireAdmin, (req, res) => {
  res.json({ products: loadProducts() });
});

// ===== API: Admin — Update Product stock =====
app.post('/api/admin/products/:id/stock', requireAdmin, (req, res) => {
  const stock = Number(req.body?.stock);
  if (!Number.isFinite(stock) || stock < 0) return res.status(400).json({ error: 'Invalid stock value' });
  const products = loadProducts();
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  p.stock = stock;
  saveProducts(products);
  res.json({ success: true, product: p });
});

// ===== API: Admin — Create Product =====
app.post('/api/admin/products', requireAdmin, (req, res) => {
  const body = req.body || {};
  const id = String(body.id || '').trim();
  if (!id || !/^[A-Za-z0-9_-]+$/.test(id)) return res.status(400).json({ error: 'Valid product id required (letters, numbers, - _)' });
  const products = loadProducts();
  if (products.some(p => p.id === id)) return res.status(400).json({ error: 'Product id already exists' });
  const name = String(body.name || '').trim() || 'Untitled Product';
  const product = {
    id,
    name,
    nameCN: body.nameCN || '',
    tagline: body.tagline || '',
    price: Number(body.price) || 0,
    compareAt: body.compareAt != null && body.compareAt !== '' ? Number(body.compareAt) : null,
    category: body.category || 'bracelet',
    intention: body.intention || '',
    crystal: body.crystal || '',
    crystalCN: body.crystalCN || '',
    chakra: body.chakra || '',
    element: body.element || '',
    planet: body.planet || '',
    description: body.description || '',
    ritual: body.ritual || '',
    properties: Array.isArray(body.properties) ? body.properties : (body.properties ? String(body.properties).split('\n').map(s => s.trim()).filter(Boolean) : []),
    rating: body.rating != null && body.rating !== '' ? Number(body.rating) : 0,
    reviews: Number(body.reviews) || 0,
    stock: Number(body.stock) || 0,
    variantStock: body.variantStock && typeof body.variantStock === 'object' ? body.variantStock : {},
    variants: Array.isArray(body.variants) ? body.variants.filter(v => v && typeof v === 'object' && v.name) : [],
    variantPrices: Array.isArray(body.variantPrices)
      ? body.variantPrices.map(v => (v === '' || v == null) ? null : Number(v)).filter(v => v !== null && !Number.isNaN(v))
      : [],
    supplier: (body.supplier && typeof body.supplier === 'object') ? body.supplier : {},
    badge: body.badge || '',
    image: body.image || '',
    images: Array.isArray(body.images) ? body.images.filter(Boolean) : (body.image ? [body.image] : []),
  };
  products.push(product);
  saveProducts(products);
  res.json({ success: true, product });
});

// ===== API: Admin — Update Product =====
app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const body = req.body || {};
  const products = loadProducts();
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  const fields = ['name', 'nameCN', 'tagline', 'price', 'compareAt', 'category', 'intention', 'crystal', 'crystalCN', 'chakra', 'element', 'planet', 'description', 'ritual', 'rating', 'reviews', 'stock', 'badge', 'image'];
  for (const f of fields) {
    if (body[f] !== undefined) {
      if (['price', 'compareAt', 'rating', 'reviews', 'stock'].includes(f)) {
        p[f] = (f === 'compareAt' && (body[f] === '' || body[f] == null)) ? null : Number(body[f]);
      } else {
        p[f] = body[f];
      }
    }
  }
  if (body.variantStock !== undefined) {
    if (body.variantStock && typeof body.variantStock === 'object') {
      p.variantStock = {};
      for (const k of Object.keys(body.variantStock)) {
        const v = body.variantStock[k];
        p.variantStock[k] = (v === '' || v == null) ? null : Number(v);
      }
    } else {
      p.variantStock = {};
    }
  }
  if (body.variants !== undefined) {
    p.variants = Array.isArray(body.variants)
      ? body.variants.filter(v => v && typeof v === 'object' && v.name).map(v => ({
          name: String(v.name || '').slice(0, 60),
          options: Array.isArray(v.options) ? v.options.map(o => String(o)).filter(Boolean) : [],
        }))
      : [];
  }
  if (body.variantPrices !== undefined) {
    p.variantPrices = Array.isArray(body.variantPrices)
      ? body.variantPrices.map(v => (v === '' || v == null) ? null : Number(v)).filter(v => v !== null && !Number.isNaN(v))
      : [];
  }
  if (body.supplier !== undefined) {
    if (body.supplier && typeof body.supplier === 'object') {
      p.supplier = body.supplier;
    } else if (typeof body.supplier === 'string') {
      try { p.supplier = JSON.parse(body.supplier); } catch (e) { p.supplier = {}; }
    } else {
      p.supplier = {};
    }
  }
  if (body.properties !== undefined) {
    p.properties = Array.isArray(body.properties) ? body.properties : String(body.properties).split('\n').map(s => s.trim()).filter(Boolean);
  }
  if (body.images !== undefined) {
    const imgs = Array.isArray(body.images) ? body.images.map(String).filter(Boolean) : String(body.images || '').split('\n').map(s => s.trim()).filter(Boolean);
    p.images = imgs;
    p.image = imgs[0] || '';
  }
  saveProducts(products);
  res.json({ success: true, product: p });
});

// ===== API: Admin — Delete Product =====
app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const products = loadProducts();
  const idx = products.findIndex(x => x.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Product not found' });
  const removed = products[idx];
  // delete its uploaded images (only files under /uploads)
  for (const img of (removed.images || [])) {
    if (typeof img === 'string' && img.startsWith('/uploads/')) {
      const fp = path.join(frontendDir, img);
      try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (e) {}
    }
  }
  products.splice(idx, 1);
  saveProducts(products);
  res.json({ success: true });
});

// ===== API: Admin — Upload Product Image =====
app.post('/api/admin/products/:id/images', requireAdmin, upload.single('image'), (req, res) => {
  const products = loadProducts();
  const p = products.find(x => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  const url = '/uploads/' + req.file.filename;
  p.images = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
  p.images.push(url);
  if (!p.image) p.image = url;
  saveProducts(products);
  res.json({ success: true, url, product: p });
});

// ===== API: Admin — Delete Product Image =====
app.delete('/api/admin/products/:id/images/:index', requireAdmin, (req, res) => {
  const idx = parseInt(req.params.index, 10);
  const products = loadProducts();
  const p = products.find(x => x.id === req.params.id);
  if (!p || !Array.isArray(p.images)) return res.status(404).json({ error: 'Product or image not found' });
  if (idx < 0 || idx >= p.images.length) return res.status(400).json({ error: 'Invalid image index' });
  const [removed] = p.images.splice(idx, 1);
  if (removed && typeof removed === 'string' && removed.startsWith('/uploads/')) {
    const fp = path.join(frontendDir, removed);
    try { if (fs.existsSync(fp)) fs.unlinkSync(fp); } catch (e) {}
  }
  p.image = p.images[0] || '';
  saveProducts(products);
  res.json({ success: true, product: p });
});

// ===== API: Admin — List Coupons =====
app.get('/api/admin/coupons', requireAdmin, (req, res) => {
  res.json({ coupons: loadCoupons() });
});

// ===== API: Admin — Create Coupon =====
app.post('/api/admin/coupons', requireAdmin, (req, res) => {
  const { code, type, value, minSubtotal, firstOrderOnly, active, description } = req.body || {};
  if (!code || !/^[A-Za-z0-9_-]+$/.test(code)) return res.status(400).json({ error: 'Valid coupon code required' });
  if (!['percent', 'fixed'].includes(type)) return res.status(400).json({ error: 'type must be percent or fixed' });
  const coupons = loadCoupons();
  if (coupons.some(c => c.code.toUpperCase() === String(code).toUpperCase())) {
    return res.status(400).json({ error: 'Coupon code already exists' });
  }
  const coupon = {
    code: String(code).toUpperCase(),
    type,
    value: Number(value) || 0,
    minSubtotal: Number(minSubtotal) || 0,
    firstOrderOnly: !!firstOrderOnly,
    active: active === undefined ? true : !!active,
    usedCount: 0,
    description: String(description || ''),
  };
  coupons.push(coupon);
  saveCoupons(coupons);
  res.json({ success: true, coupon });
});

// ===== API: Admin — Update Coupon =====
app.put('/api/admin/coupons/:code', requireAdmin, (req, res) => {
  const coupons = loadCoupons();
  const c = coupons.find(x => x.code.toUpperCase() === req.params.code.toUpperCase());
  if (!c) return res.status(404).json({ error: 'Coupon not found' });
  const { type, value, minSubtotal, firstOrderOnly, active, description } = req.body || {};
  if (type !== undefined) c.type = type;
  if (value !== undefined) c.value = Number(value) || 0;
  if (minSubtotal !== undefined) c.minSubtotal = Number(minSubtotal) || 0;
  if (firstOrderOnly !== undefined) c.firstOrderOnly = !!firstOrderOnly;
  if (active !== undefined) c.active = !!active;
  if (description !== undefined) c.description = String(description);
  saveCoupons(coupons);
  res.json({ success: true, coupon: c });
});

// ===== API: Admin — Delete Coupon =====
app.delete('/api/admin/coupons/:code', requireAdmin, (req, res) => {
  const coupons = loadCoupons();
  const idx = coupons.findIndex(x => x.code.toUpperCase() === req.params.code.toUpperCase());
  if (idx < 0) return res.status(404).json({ error: 'Coupon not found' });
  const removed = coupons.splice(idx, 1)[0];
  saveCoupons(coupons);
  res.json({ success: true, removed });
});

// ===== API: Customer — Register =====
app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const emailKey = email.trim().toLowerCase();
    if (loadUsers().find(u => u.email === emailKey)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: 'U' + Date.now().toString().slice(-8) + crypto.randomInt(100, 999),
      email: emailKey,
      name: String(name).slice(0, 100),
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    saveUser(user);
    const token = signToken(user);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (e) {
    console.error('[Auth] register error:', e.message);
    res.status(500).json({ error: 'Registration failed. Please try again later.' });
  }
});

// ===== API: Customer — Login =====
app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const emailKey = email.trim().toLowerCase();
    const user = loadUsers().find(u => u.email === emailKey);
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ error: 'Invalid email or password.' });
    const token = signToken(user);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (e) {
    console.error('[Auth] login error:', e.message);
    res.status(500).json({ error: 'Login failed. Please try again later.' });
  }
});

// ===== API: Customer — Current profile =====
app.get('/api/me', requireAuth, (req, res) => {
  const user = loadUsers().find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: publicUser(user) });
});

// ===== API: Customer — My orders =====
app.get('/api/me/orders', requireAuth, (req, res) => {
  const orders = loadOrders()
    .filter(o => (o.userId && o.userId === req.user.id) ||
      (o.userEmail && o.userEmail.toLowerCase() === req.user.email.toLowerCase()))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ orders });
});

// ===== API: Admin — List reviews (optional ?status=pending|approved|rejected) =====
app.get('/api/admin/reviews', requireAdmin, (req, res) => {
  let reviews = loadReviews().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (req.query.status) reviews = reviews.filter(r => r.status === req.query.status);
  res.json({ reviews });
});

// ===== API: Admin — Update review status (moderation) =====
app.post('/api/admin/reviews/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Use approved, rejected or pending.' });
  }
  const reviews = loadReviews();
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Review not found' });
  reviews[idx].status = status;
  if (status === 'approved' && !reviews[idx].approvedAt) reviews[idx].approvedAt = new Date().toISOString();
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  res.json({ success: true, review: reviews[idx] });
});

// ===== API: Admin — Delete a review =====
app.delete('/api/admin/reviews/:id', requireAdmin, (req, res) => {
  const reviews = loadReviews();
  const idx = reviews.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Review not found' });
  const removed = reviews.splice(idx, 1)[0];
  for (const img of (removed.images || [])) {
    if (typeof img === 'string' && img.startsWith('/uploads/reviews/')) {
      try { fs.unlinkSync(path.join(frontendDir, img)); } catch (e) {}
    }
  }
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
  res.json({ success: true });
});

// ===== API: Admin — Dashboard stats =====
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const orders = loadOrders();
  const products = loadProducts();
  const reviews = loadReviews();
  const paid = orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status));
  const revenue = paid.reduce((s, o) => s + (Number(o.total ?? o.totals?.total) || 0), 0);
  const orderTotal = (o) => Number(o.total ?? o.totals?.total) || 0;

  const salesMap = {};
  for (const o of paid) {
    for (const it of (o.items || [])) {
      const key = it.id || it.name;
      if (!salesMap[key]) salesMap[key] = { id: it.id, name: it.name, qty: 0, revenue: 0 };
      salesMap[key].qty += (Number(it.qty) || 1);
      salesMap[key].revenue += (Number(it.price) || 0) * (Number(it.qty) || 1);
    }
  }
  const topProducts = Object.values(salesMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const lowStock = products
    .filter(p => Number(p.stock) <= 5)
    .map(p => ({ id: p.id, name: p.name, stock: Number(p.stock) }))
    .sort((a, b) => a.stock - b.stock);

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayRev = paid
      .filter(o => (o.createdAt || '').slice(0, 10) === key)
      .reduce((s, o) => s + orderTotal(o), 0);
    last7.push({ date: key, revenue: Math.round(dayRev * 100) / 100 });
  }

  const pendingReviews = reviews.filter(r => r.status === 'pending').length;

  const recentOrders = orders
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map(o => ({
      orderId: o.orderId,
      status: o.status,
      createdAt: o.createdAt,
      total: orderTotal(o),
      customer: { name: (o.customer || {}).name || '', email: (o.customer || {}).email || '' },
      itemCount: (o.items || []).reduce((s, i) => s + (Number(i.qty) || 1), 0),
    }));

  res.json({
    totalOrders: orders.length,
    paidOrders: paid.length,
    pendingOrders: orders.filter(o => o.status === 'pending_payment').length,
    revenue: Math.round(revenue * 100) / 100,
    avgOrderValue: paid.length ? Math.round((revenue / paid.length) * 100) / 100 : 0,
    customers: loadUsers().length,
    pendingReviews,
    totalReviews: reviews.length,
    topProducts,
    lowStock,
    last7,
    recentOrders,
  });
});

// ===== Newsletter / Subscribers =====
const SUBSCRIBERS_FILE = path.join(__dirname, 'subscribers.json');
function loadSubscribers() {
  try { if (fs.existsSync(SUBSCRIBERS_FILE)) return JSON.parse(fs.readFileSync(SUBSCRIBERS_FILE, 'utf8')); } catch (e) { console.error('Error loading subscribers:', e.message); }
  return [];
}
function saveSubscribers(list) { fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(list, null, 2)); }

// ===== Refund Requests =====
const REFUNDS_FILE = path.join(__dirname, 'refund-requests.json');
function loadRefunds() {
  try { if (fs.existsSync(REFUNDS_FILE)) return JSON.parse(fs.readFileSync(REFUNDS_FILE, 'utf8')); } catch (e) { console.error('Error loading refunds:', e.message); }
  return [];
}
function saveRefunds(list) { fs.writeFileSync(REFUNDS_FILE, JSON.stringify(list, null, 2)); }

function escapeHtmlServer(text) {
  const str = String(text || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ===== Password Reset Email =====
function emailPasswordReset(user, resetUrl) {
  return sendEmail({
    to: user.email,
    subject: 'Aurae — Reset your password',
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#2a2a2a;">
      <h2 style="font-family:'Cormorant Garamond',serif;">Reset your password</h2>
      <p>Hi ${escapeHtmlServer(user.name || 'Beautiful Soul')}, click the link below to reset your Aurae password. This link expires in 1 hour.</p>
      <a href="${escapeHtmlServer(resetUrl)}" style="display:inline-block;background:#2a2a2a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0;">Reset Password</a>
      <p style="color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>`,
  });
}

// ===== API: Public — Newsletter subscribe =====
app.post('/api/newsletter', publicLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
  const list = loadSubscribers();
  if (list.some(s => s.email === email)) return res.json({ success: true, alreadySubscribed: true });
  list.push({ email, createdAt: new Date().toISOString() });
  saveSubscribers(list);
  await sendEmail({
    to: email,
    subject: 'Welcome to Aurae',
    html: `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:auto;color:#2a2a2a;">
      <h2 style="font-family:'Cormorant Garamond',serif;">Welcome to Aurae 🌙</h2>
      <p>Thank you for subscribing. You'll be the first to know about new crystals, rituals, and exclusive offers.</p>
      <p style="color:#888;font-size:12px;">Aurae Crystal Store</p>
    </div>`,
  });
  res.json({ success: true });
});

// ===== API: Public — Capture abandoned cart for recovery emails =====
app.post('/api/abandoned-cart', publicLimiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email required.' });
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
  const items = rawItems.slice(0, 20).map(i => ({
    id: String(i.id || ''),
    name: String(i.name || '').slice(0, 120),
    price: Number(i.price) || 0,
    qty: Math.max(1, parseInt(i.qty, 10) || 1),
    variant: String(i.variant || '').slice(0, 60),
    image: String(i.image || '').slice(0, 300),
  })).filter(i => i.name);
  if (!items.length) return res.status(400).json({ error: 'Cart is empty.' });

  const carts = loadAbandonedCarts();
  const now = Date.now();
  const existing = carts.find(c => c.email === email && !c.converted);
  if (existing) {
    const age = now - new Date(existing.createdAt).getTime();
    existing.items = items;
    existing.name = String(req.body?.name || existing.name || '').slice(0, 120);
    existing.createdAt = new Date().toISOString();
    if (age >= 24 * 3600 * 1000) { existing.emailed = false; existing.reminders = 0; } // allow a fresh recovery cycle
    saveAbandonedCarts(carts);
    return res.json({ success: true, captured: true });
  }
  carts.push({
    id: 'ac_' + now.toString(36) + Math.random().toString(36).slice(2, 8),
    email,
    name: String(req.body?.name || '').slice(0, 120),
    items,
    createdAt: new Date().toISOString(),
    emailed: false,
    converted: false,
    reminders: 0,
  });
  saveAbandonedCarts(carts);
  res.json({ success: true, captured: true });
});

// ===== API: Admin — Subscribers list =====
app.get('/api/admin/subscribers', requireAdmin, (req, res) => {
  res.json({ subscribers: loadSubscribers() });
});

// ===== API: Public — Forgot password =====
app.post('/api/forgot-password', authLimiter, async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const users = loadUsers();
  const user = users.find(u => (u.email || '').toLowerCase() === email);
  if (!user) return res.json({ success: true }); // don't reveal whether email exists
  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  saveUsers(users);
  await emailPasswordReset(user, `${DOMAIN}/reset-password.html?token=${token}`);
  res.json({ success: true });
});

// ===== API: Public — Reset password =====
app.post('/api/reset-password', authLimiter, async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password || password.length < 6) return res.status(400).json({ error: 'Invalid request.' });
  const users = loadUsers();
  const user = users.find(u => u.resetToken === token && u.resetTokenExpiry > Date.now());
  if (!user) return res.status(400).json({ error: 'Reset link expired or invalid.' });
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  saveUsers(users);
  res.json({ success: true });
});

// ===== API: Auth — Change password =====
app.post('/api/me/password', requireAuth, authLimiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Current and new password required (min 6 chars).' });
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const match = await bcrypt.compare(currentPassword, user.passwordHash || '');
  if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  saveUsers(users);
  res.json({ success: true });
});

// ===== API: Auth — Wishlist =====
app.get('/api/me/wishlist', requireAuth, (req, res) => {
  const user = loadUsers().find(u => u.id === req.user.id);
  res.json({ wishlist: user?.wishlist || [] });
});
app.post('/api/me/wishlist', requireAuth, (req, res) => {
  const productId = req.body?.productId;
  if (!productId) return res.status(400).json({ error: 'productId required' });
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!Array.isArray(user.wishlist)) user.wishlist = [];
  if (!user.wishlist.includes(productId)) user.wishlist.push(productId);
  saveUsers(users);
  res.json({ success: true, wishlist: user.wishlist });
});
app.delete('/api/me/wishlist/:productId', requireAuth, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.wishlist = (user.wishlist || []).filter(id => id !== req.params.productId);
  saveUsers(users);
  res.json({ success: true, wishlist: user.wishlist });
});

// ===== API: Auth — Addresses =====
app.get('/api/me/addresses', requireAuth, (req, res) => {
  const user = loadUsers().find(u => u.id === req.user.id);
  res.json({ addresses: user?.addresses || [] });
});
app.post('/api/me/addresses', requireAuth, (req, res) => {
  const { label, name, line1, line2, city, state, zip, country, phone } = req.body || {};
  if (!line1 || !city || !zip) return res.status(400).json({ error: 'Address line, city and ZIP required.' });
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!Array.isArray(user.addresses)) user.addresses = [];
  const isDefault = req.body?.isDefault || user.addresses.length === 0;
  if (isDefault) user.addresses.forEach(a => a.isDefault = false);
  const addr = { id: crypto.randomUUID(), label: label || 'Home', name, line1, line2, city, state, zip, country: country || 'US', phone, isDefault, createdAt: new Date().toISOString() };
  user.addresses.push(addr);
  saveUsers(users);
  res.json({ success: true, address: addr });
});
app.put('/api/me/addresses/:id', requireAuth, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user || !Array.isArray(user.addresses)) return res.status(404).json({ error: 'Not found' });
  const idx = user.addresses.findIndex(a => a.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Address not found' });
  Object.assign(user.addresses[idx], req.body);
  if (req.body?.isDefault) user.addresses.forEach((a, i) => { if (i !== idx) a.isDefault = false; });
  saveUsers(users);
  res.json({ success: true, address: user.addresses[idx] });
});
app.delete('/api/me/addresses/:id', requireAuth, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user || !Array.isArray(user.addresses)) return res.status(404).json({ error: 'Not found' });
  user.addresses = user.addresses.filter(a => a.id !== req.params.id);
  saveUsers(users);
  res.json({ success: true });
});

// ===== API: Auth — Cart sync =====
app.get('/api/me/cart', requireAuth, (req, res) => {
  const user = loadUsers().find(u => u.id === req.user.id);
  res.json({ cart: user?.cart || [] });
});
app.put('/api/me/cart', requireAuth, (req, res) => {
  const cart = req.body?.cart;
  if (!Array.isArray(cart)) return res.status(400).json({ error: 'cart array required' });
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.cart = cart;
  saveUsers(users);
  res.json({ success: true });
});
app.delete('/api/me/cart', requireAuth, (req, res) => {
  const users = loadUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.cart = [];
  saveUsers(users);
  res.json({ success: true });
});

// ===== API: Auth — Refund request =====
app.post('/api/refund-requests', requireAuth, (req, res) => {
  const { orderId, reason, items } = req.body || {};
  if (!orderId || !reason) return res.status(400).json({ error: 'orderId and reason required.' });
  const orders = loadOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return res.status(404).json({ error: 'Order not found.' });
  const orderUserId = order.userId;
  const orderEmail = (order.customer?.email || '').toLowerCase();
  if (orderUserId && orderUserId !== req.user.id && orderEmail !== req.user.email.toLowerCase()) {
    return res.status(403).json({ error: 'This order does not belong to you.' });
  }
  const refunds = loadRefunds();
  const existing = refunds.find(r => r.orderId === orderId && r.userId === req.user.id && !['rejected', 'resolved'].includes(r.status));
  if (existing) return res.status(400).json({ error: 'A refund request for this order is already pending.' });
  const refund = {
    id: crypto.randomUUID(),
    orderId,
    userId: req.user.id,
    userEmail: req.user.email,
    reason,
    items: items || [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  refunds.push(refund);
  saveRefunds(refunds);
  res.json({ success: true, refund });
});

// ===== API: Admin — Refund requests =====
app.get('/api/admin/refund-requests', requireAdmin, (req, res) => {
  res.json({ refunds: loadRefunds() });
});
// Issue a PayPal refund against a captured payment (best-effort).
// Returns { ok, skipped?, error? }. Never throws.
async function issuePayPalRefund(captureId) {
  if (!captureId) return { ok: false, skipped: true };
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      return { ok: false, skipped: true };
    }
    const accessToken = await getPayPalAccessToken();
    const resp = await fetch(`${PAYPAL_API_BASE}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({}),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.warn('[PayPal] Refund failed for capture', captureId, JSON.stringify(err));
      return { ok: false, error: err };
    }
    const data = await resp.json();
    console.log('[PayPal] Refund issued for capture', captureId);
    return { ok: true, data };
  } catch (e) {
    console.warn('[PayPal] Refund exception for capture', captureId, e.message);
    return { ok: false, error: e.message };
  }
}

app.post('/api/admin/refund-requests/:id/status', requireAdmin, async (req, res) => {
  const { status, note } = req.body || {};
  if (!['pending', 'approved', 'rejected', 'resolved'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const refunds = loadRefunds();
  const r = refunds.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: 'Refund request not found.' });
  r.status = status;
  r.note = note || '';
  r.updatedAt = new Date().toISOString();
  // On approval: mark the linked order as refunded, restore stock, and (best-effort)
  // issue a real PayPal refund against the captured payment.
  if (status === 'approved') {
    const orders = loadOrders();
    const order = orders.find(o => o.orderId === r.orderId);
    if (order) {
      if (order.items && order.status !== 'refunded') {
        restoreStock(order.items);
      }
      order.status = 'refunded';
      order.refundedAt = new Date().toISOString();
      order.refundReason = r.reason || '';
      if (order.paypalCaptureId && !order.paypalRefunded) {
        const rr = await issuePayPalRefund(order.paypalCaptureId);
        order.paypalRefunded = rr.ok;
        if (!rr.ok && !rr.skipped) {
          order.paypalRefundError = String((rr.error && rr.error.message) || rr.error || 'unknown error');
        }
      }
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    }
  }
  saveRefunds(refunds);
  res.json({ success: true, refund: r });
});

// ===== SEO: Static sitemap.xml =====
// sitemap.xml is generated as a real file on disk (see writeSitemapFile above)
// and served by express.static. This is more reliable for Google Search Console
// than a dynamic route, and it is regenerated whenever products change.

// Inject per-page <title>/<description>/<canonical>/OG into the SPA shell so that
// real users (and "View Source") see the correct page metadata — not the
// hardcoded homepage values — before the client-side JS takes over.
function injectSeoHead(html, meta) {
  if (!meta) return html;
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(meta.desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${esc(meta.canonical)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(meta.title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(meta.desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${esc(meta.canonical)}">`);
}
const SPA_SHELL = (() => {
  try { return fs.readFileSync(path.join(frontendDir, 'index.html'), 'utf8'); }
  catch (e) { console.error('[SEO] failed to read index.html shell:', e.message); return ''; }
})();

// ===== Catch-all: SPA fallback (Express 4 safe) =====
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Crawlers that reach here hit a URL that is neither a real static file nor a
  // valid SPA route — return a real 404 so they never index a soft-404 shell.
  if (ssr.isBot(req)) {
    return res.status(404).type('html').send(
      '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Page not found — Aurae</title>' +
      '<meta name="robots" content="noindex"></head><body><h1>Page not found</h1>' +
      '<p><a href="/">Return to Aurae home</a></p></body></html>'
    );
  }
  // Real user: serve the SPA shell with the correct per-page title/canonical
  // injected server-side (so View Source shows the right values).
  const meta = ssr.getPageMeta(req, { products: loadProducts(), domain: DOMAIN });
  res.type('html').send(injectSeoHead(SPA_SHELL, meta));
});

// ===== Global error handler (must be registered last) =====
app.use((err, req, res, next) => {
  // Body-parser / request errors (malformed JSON, body too large, bad encoding)
  // are client-side mistakes. Return the correct 4xx and avoid polluting the
  // error log with a scary "Unhandled error" — these are expected, not failures.
  if (err && err.type && typeof err.type === 'string' && err.type.startsWith('entity.')) {
    const status = (err.status && err.status >= 400 && err.status < 500) ? err.status : 400;
    console.warn('[WARN] request body error:', err.type, '-', req.method, req.originalUrl);
    if (res.headersSent) return next(err);
    return res.status(status).json({ error: 'Invalid request body.' });
  }
  console.error('[ERROR] Unhandled error:', (err && err.stack) || err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Internal server error. Please try again later.' });
});

// ===== Start Server =====
const server = app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║     Aurae Payment Server Started        ║');
  console.log('╠════════════════════════════════════════════════╣');
  console.log(`║  URL:       ${DOMAIN}`.padEnd(49) + '║');
  console.log(`║  Stripe:    ${stripe ? '✓ Ready' : '✗ Not configured'}`.padEnd(49) + '║');
  console.log(`║  PayPal:    ${process.env.PAYPAL_CLIENT_ID ? '✓ Ready' : '✗ Not configured'}`.padEnd(49) + '║');
  console.log(`║  PayMode:   ${process.env.PAYPAL_MODE || 'sandbox'}`.padEnd(49) + '║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Open the URL above in your browser');
  console.log('  2. To test payments, use Stripe test card: 4242 4242 4242 4242');
  console.log('  3. Configure webhooks in Stripe/PayPal dashboards for production');
  console.log('');
});

// ===== Handle fatal listen errors (e.g. port already in use) =====
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[FATAL] Port ${PORT} is already occupied by another process.\n` +
      `        Fix: sudo lsof -i :${PORT}  ->  sudo kill -9 <PID>  ->  pm2 restart aurae\n`
    );
  } else {
    console.error('[FATAL] Server failed to start:', err.message);
  }
  process.exit(1);
});
