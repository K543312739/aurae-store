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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ===== Security: block access to server/runtime/sensitive files =====
// express.static would otherwise serve anything under the project root
// (e.g. /server/users.json, /server/server.js, /package.json).
const SENSITIVE_PREFIXES = ['/server/', '/node_modules/', '/.git/'];
const SENSITIVE_FILES = ['/package.json', '/package-lock.json', '/server.js', '/.env'];
app.use((req, res, next) => {
  const p = (req.path || '').toLowerCase();
  if (p.startsWith('/.well-known/')) return next(); // Let's Encrypt ACME challenge
  if (SENSITIVE_PREFIXES.some((s) => p.startsWith(s))) return res.status(404).end();
  if (SENSITIVE_FILES.includes(p) || p.endsWith('.env')) return res.status(404).end();
  if (p.split('/').some((seg) => seg.startsWith('.'))) return res.status(404).end();
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
app.use(express.static(frontendDir, { dotfiles: 'deny' }));

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
}

function getProductStock(id) {
  const p = loadProducts().find(x => x.id === id);
  return p ? Number(p.stock) : null;
}

function decrementStock(items) {
  const products = loadProducts();
  let changed = false;
  for (const item of (items || [])) {
    const p = products.find(x => x.id === item.id);
    if (p) {
      p.stock = Math.max(0, (Number(p.stock) || 0) - (Number(item.qty) || 1));
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

// Finalize a paid order: decrement inventory + send confirmation email + bump coupon usage.
function finalizePaidOrder(orderId) {
  const orders = loadOrders();
  const order = orders.find(o => o.orderId === orderId);
  if (!order) return;
  decrementStock(order.items || []);
  if (order.coupon) {
    const coupons = loadCoupons();
    const c = coupons.find(x => x.code.toUpperCase() === String(order.coupon).toUpperCase());
    if (c) { c.usedCount = (c.usedCount || 0) + 1; saveCoupons(coupons); }
  }
  emailOrderConfirmation(order);
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
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'aurae2026';
const ADMIN_TOKEN = crypto.createHash('sha256').update('aurae-admin-salt:' + ADMIN_PASSWORD).digest('hex');

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

  try {
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // For development without webhook secret
      event = JSON.parse(req.body);
      console.warn('[Stripe Webhook] No webhook secret set - skipping verification (dev mode only!)');
    }
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
  
  res.json(order);
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
  res.json({ id: p.id, name: p.name, stock: Number(p.stock) });
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

// ===== API: Admin — Delete Order =====
app.delete('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const orders = loadOrders();
  const idx = orders.findIndex(o => o.orderId === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  const removed = orders.splice(idx, 1)[0];
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
    rating: Number(body.rating) || 5,
    reviews: Number(body.reviews) || 0,
    stock: Number(body.stock) || 0,
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

// ===== Catch-all: SPA fallback (Express 4 safe) =====
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// ===== Global error handler (must be registered last) =====
app.use((err, req, res, next) => {
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
