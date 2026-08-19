/* ===== Aurae - App Logic ===== */

// State
let cart = JSON.parse(localStorage.getItem('crystalCart') || '[]');
let cartCoupon = JSON.parse(localStorage.getItem('auraeCartCoupon') || '{"code":"","applied":false}');
let currentView = 'home';
let currentProduct = null;
let selectedVariant = {};
let qty = 1;

// Quiz state
let quizStep = 0;
let quizAnswers = [];
let quizScores = {};

// Shop browser state (sort / filter / search)
let shopState = { filter: 'all', sort: 'featured', priceRange: 'all', search: '' };

// ===== Helpers =====
function formatPrice(price) {
  return '$' + price.toFixed(2);
}

function getStockStatus(stock) {
  const s = Number(stock) || 0;
  if (s <= 0) return { label: 'Sold Out', cls: 'out', dot: '' };
  if (s <= 10) return { label: 'Low Stock · Only ' + s + ' left', cls: 'low', dot: '' };
  return { label: 'In Stock', cls: 'in', dot: '' };
}

function getStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function saveCart(silent) {
  capCartQuantities(silent);
  localStorage.setItem('crystalCart', JSON.stringify(cart));
  updateCartCount();
  syncCartToServer();
}

async function syncCartToServer() {
  const token = getAuthToken();
  if (!token) return;
  try {
    await fetch('/api/me/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ cart }),
    });
  } catch (e) { /* silent */ }
}

function mergeCarts(localCart, serverCart) {
  const map = new Map();
  for (const item of serverCart || []) {
    const key = `${item.id}:${item.variant || ''}`;
    map.set(key, { ...item });
  }
  for (const item of localCart || []) {
    const key = `${item.id}:${item.variant || ''}`;
    if (map.has(key)) {
      map.get(key).qty = Math.max(map.get(key).qty, item.qty);
    } else {
      map.set(key, { ...item });
    }
  }
  return Array.from(map.values());
}

async function loadServerCart() {
  const token = getAuthToken();
  if (!token) return;
  try {
    const resp = await fetch('/api/me/cart', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) return;
    const data = await resp.json();
    const serverCart = data.cart || [];
    cart = mergeCarts(cart, serverCart);
    saveCart(true);
    renderCart();
    updateCartCount();
  } catch (e) { /* silent */ }
}

function capCartQuantities(silent) {
  let capped = false;
  for (const item of cart) {
    const product = PRODUCTS.find(p => p.id === item.id);
    const available = getVariantStockFrontend(product, item.variant);
    if (item.qty > available) {
      item.qty = Math.max(0, available);
      capped = true;
    }
  }
  cart = cart.filter(item => item.qty > 0);
  if (capped && !silent) showToast('Some cart items were adjusted due to stock changes.');
}

function saveCartCoupon() {
  localStorage.setItem('auraeCartCoupon', JSON.stringify(cartCoupon));
}

function getCartTotals(items = cart) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 50 ? 0 : 5.99;
  let discount = 0;
  if (cartCoupon.applied && String(cartCoupon.code).toUpperCase() === 'CRYSTAL10') {
    discount = Math.round(subtotal * 0.10 * 100) / 100;
  }
  const taxable = Math.max(0, subtotal - discount);
  const tax = Math.round(taxable * 0.08 * 100) / 100;
  const total = Math.round((taxable + shipping + tax) * 100) / 100;
  return { subtotal, shipping, discount, tax, total };
}

function isCouponAlreadyUsed() {
  if (localStorage.getItem('auraeCouponUsed') === 'true') return true;
  const orders = JSON.parse(localStorage.getItem('auraeOrders') || '[]');
  return orders.length > 0;
}

function markCouponUsed() {
  if (cartCoupon.applied) {
    localStorage.setItem('auraeCouponUsed', 'true');
    cartCoupon = { code: '', applied: false };
    localStorage.removeItem('auraeCartCoupon');
  }
}

function applyCoupon() {
  const input = document.getElementById('couponInput');
  const msgEl = document.getElementById('couponMessage');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (!code) {
    if (msgEl) { msgEl.textContent = 'Please enter a coupon code'; msgEl.className = 'coupon-message error'; }
    return;
  }
  if (code !== 'CRYSTAL10') {
    if (msgEl) { msgEl.textContent = 'Invalid coupon code'; msgEl.className = 'coupon-message error'; }
    return;
  }
  if (isCouponAlreadyUsed()) {
    if (msgEl) { msgEl.textContent = 'This first-order coupon has already been used'; msgEl.className = 'coupon-message error'; }
    return;
  }
  cartCoupon = { code, applied: true };
  saveCartCoupon();
  renderCart();
  if (msgEl) { msgEl.textContent = 'Coupon applied — 10% off your first order'; msgEl.className = 'coupon-message success'; }
}

function removeCoupon() {
  cartCoupon = { code: '', applied: false };
  localStorage.removeItem('auraeCartCoupon');
  renderCart();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const el = document.getElementById('cartCount');
  if (el) el.textContent = count;
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ===== Pinterest Tag helper =====
function pintrkTrack(event, data = {}) {
  if (typeof window.pintrk !== 'function') return;
  const payload = {
    event_id: 'aurae_' + event + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    ...data
  };
  try {
    window.pintrk('track', event, payload);
  } catch (e) { /* silent */ }
}

function buildPinterestLineItems(items) {
  return items.map(item => {
    const product = PRODUCTS.find(p => p.id === item.id);
    return {
      product_name: item.name,
      product_id: String(item.id),
      product_category: product?.category || '',
      product_price: Number(item.price) || 0,
      product_quantity: Number(item.qty) || 1
    };
  }).filter(i => i.product_quantity > 0);
}

// ===== Navigation (History API SPA routing) =====
// renderView: pure client-side view switch (no URL change).
function renderView(view, param) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  if (view === 'home') {
    document.getElementById('homeView').classList.add('active');
    currentView = 'home';
    updateViewSEO('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'shop') {
    document.getElementById('shopView').classList.add('active');
    currentView = 'shop';
    renderShop(param || 'all');
    updateViewSEO('shop', param);
    if (param && String(param).startsWith('category:')) {
      pintrkTrack('viewcategory', { product_category: String(param).replace('category:', '') });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'product') {
    document.getElementById('productView').classList.add('active');
    currentView = 'product';
    renderProductDetail(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'checkout') {
    if (cart.length === 0) {
      showToast('Your cart is empty');
      renderView('home');
      return;
    }
    document.getElementById('checkoutView').classList.add('active');
    currentView = 'checkout';
    renderCheckout();
    const totals = getCartTotals();
    pintrkTrack('checkout', {
      value: totals.total,
      order_quantity: cart.reduce((sum, item) => sum + item.qty, 0),
      currency: 'USD',
      line_items: buildPinterestLineItems(cart)
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'about') {
    document.getElementById('aboutView').classList.add('active');
    currentView = 'about';
    updateViewSEO('about');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'contact') {
    document.getElementById('contactView').classList.add('active');
    currentView = 'contact';
    updateViewSEO('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'blog') {
    document.getElementById('blogView').classList.add('active');
    currentView = 'blog';
    renderBlogDetail(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'track') {
    document.getElementById('trackView').classList.add('active');
    currentView = 'track';
    renderTrack(param);
    updateViewSEO('track');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  if (view !== 'product' && view !== 'checkout') {
    const navMap = { home: 'navHome', shop: 'navShop', about: 'navAbout', contact: 'navContact' };
    if (navMap[view]) document.getElementById(navMap[view])?.classList.add('active');
  }

  // Pinterest SPA pageview
  pintrkTrack('pagevisit', {});
}

// Build the canonical URL for a given view (used for History API state).
function viewToUrl(view, param) {
  const base = window.location.pathname;
  if (view === 'home') return base;
  if (view === 'shop') return base + '?shop=' + encodeURIComponent(param || 'all');
  if (view === 'product') return base + '?product=' + encodeURIComponent(param || '');
  if (view === 'blog' && param) return base + '?blog=' + encodeURIComponent(param);
  if (view === 'about') return base + '?view=about';
  if (view === 'contact') return base + '?view=contact';
  if (view === 'checkout') return base + '?view=checkout';
  if (view === 'track') return base + '?view=track';
  return base;
}

// navigate: in-app navigation that pushes a real history entry so the
// browser Back/Forward buttons traverse the SPA instead of leaving the site.
function navigate(view, param, opts) {
  opts = opts || {};
  const hasViews = !!document.getElementById('homeView');

  // Standalone pages (no SPA shell, e.g. legal pages) → full reload.
  if (!hasViews) {
    if (view === 'home') window.location.href = 'index.html';
    else if (view === 'shop') window.location.href = 'index.html?shop=' + encodeURIComponent(param || 'all');
    else if (view === 'product') window.location.href = 'index.html?product=' + encodeURIComponent(param || '');
    else if (view === 'about') window.location.href = 'index.html?view=about';
    else if (view === 'contact') window.location.href = 'index.html?view=contact';
    else if (view === 'blog') window.location.href = 'index.html?blog=' + encodeURIComponent(param || '');
    else if (view === 'track') window.location.href = 'index.html?view=track';
    return;
  }

  const url = viewToUrl(view, param);
  if (opts.replace) {
    window.history.replaceState({ view, param }, '', url);
  } else {
    window.history.pushState({ view, param }, '', url);
  }
  renderView(view, param);
}

// Handle browser Back/Forward: re-render the view that the URL describes.
function handlePopState() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('product')) {
    const pid = params.get('product');
    if (PRODUCTS.find(p => p.id === pid)) { renderView('product', pid); return; }
  }
  if (params.has('blog')) {
    const bid = params.get('blog');
    if (BLOG_POSTS.find(b => b.id === bid)) { renderView('blog', bid); return; }
  }
  if (params.has('shop') || params.get('view') === 'shop') {
    const shopParam = params.get('shop') || (params.get('category') ? 'category:' + params.get('category') : 'all');
    renderView('shop', shopParam); return;
  }
  if (params.get('view') === 'about') { renderView('about'); return; }
  if (params.get('view') === 'contact') { renderView('contact'); return; }
  if (params.get('view') === 'checkout') { renderView('checkout'); return; }
  if (params.get('view') === 'track') { renderView('track'); return; }
  renderView('home');
}

// ===== Render Home Page =====
function renderHome() {
  // Best sellers (badge === 'Best Seller')
  const bestSellers = PRODUCTS.filter(p => p.badge === 'Best Seller').slice(0, 4);
  document.getElementById('bestSellersGrid').innerHTML = bestSellers.map(p => productCardHTML(p, { showHeart: true })).join('');

  // Featured products
  const featured = [
    PRODUCTS.find(p => p.id === 'p001'),
    PRODUCTS.find(p => p.id === 'p005'),
    PRODUCTS.find(p => p.id === 'p010'),
    PRODUCTS.find(p => p.id === 'p013')
  ].filter(Boolean);
  document.getElementById('featuredGrid').innerHTML = featured.map(p => productCardHTML(p, { showHeart: true })).join('');

  // Intentions
  document.getElementById('intentionsGrid').innerHTML = INTENTIONS.map(i => `
    <div class="intention-card" onclick="navigate('shop', 'intention:${i.id}')">
      <div class="intention-icon">${i.icon}</div>
      <div class="intention-name">${i.name}</div>
      <div class="intention-desc">${i.desc}</div>
    </div>
  `).join('');

  // Blog
  document.getElementById('blogGrid').innerHTML = BLOG_POSTS.map(b => `
    <div class="blog-card" onclick="navigate('blog', '${escapeHtml(b.id)}')">
      <img src="${escapeHtml(b.image)}" alt="${escapeHtml(b.title)}" loading="lazy" decoding="async">
      <div class="blog-meta">${escapeHtml(b.category)} • ${escapeHtml(b.readTime)}</div>
      <h4>${escapeHtml(b.title)}</h4>
      <p>${escapeHtml(b.excerpt)}</p>
    </div>
  `).join('');

  attachProductCardHandlers();
  // Initialize quiz
  initQuiz();
}

function productCardHTML(p, opts = {}) {
  const badge = p.badge ? `<div class="product-badge">${escapeHtml(p.badge)}</div>` : '';
  const saleBadge = p.compareAt ? `<div class="product-badge sale">Sale</div>` : '';
  const stock = getStockStatus(p.stock);
  const stockBadge = stock.cls !== 'in'
    ? `<div class="product-stock-badge ${escapeHtml(stock.cls)}">${escapeHtml(stock.label)}</div>`
    : '';
  const fromPrefix = (p.variantPrices && p.variants) ? 'From ' : '';
  const priceHTML = p.compareAt
    ? `<span class="product-price">${formatPrice(p.price)}<span class="compare-at">${formatPrice(p.compareAt)}</span></span>`
    : `<span class="product-price">${fromPrefix}${formatPrice(p.price)}</span>`;
  const heart = opts.showHeart ? `<button class="wishlist-btn" data-wishlist-id="${escapeHtml(p.id)}" onclick="event.stopPropagation(); toggleWishlist('${escapeHtml(p.id)}')">${isWishlisted(p.id) ? '♥' : '♡'}</button>` : '';

  return `
    <div class="product-card" data-product-id="${escapeHtml(p.id)}">
      ${heart}${badge}${saleBadge}${stockBadge}
      <div class="product-image">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-tagline">${escapeHtml(p.tagline)}</div>
        <div class="product-rating">
          <span class="stars">${getStars(p.rating)}</span>
          <span>(${escapeHtml(p.reviews)})</span>
        </div>
        ${priceHTML}
        <button class="product-quick-add" onclick="event.stopPropagation(); quickAddToCart('${escapeHtml(p.id)}')">Quick Add</button>
      </div>
    </div>
  `;
}

function attachProductCardHandlers() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.productId;
      navigate('product', id);
    });
  });
}

// ===== Render Shop Page =====
function setShopSort(sort) { shopState.sort = sort; renderShop(null, true); }
function setShopPrice(range) { shopState.priceRange = range; renderShop(null, true); }
function setShopSearch(q) { shopState.search = (q || '').trim().toLowerCase(); renderShop(null, true); }

function renderShop(filter, keepState) {
  let products = [...PRODUCTS];
  let title = 'All Crystal Jewelry';
  let subtitle = 'Discover authentic crystal jewelry crafted with intention for every energy need';

  if (!keepState && filter) shopState.filter = filter || 'all';
  const state = shopState;

  if (state.filter && state.filter.startsWith('category:')) {
    const catId = state.filter.split(':')[1];
    const cat = CATEGORIES.find(c => c.id === catId);
    products = products.filter(p => p.category === catId);
    title = cat ? cat.name : title;
    subtitle = cat ? cat.desc : subtitle;
  } else if (state.filter && state.filter.startsWith('intention:')) {
    const intentId = state.filter.split(':')[1];
    const intent = INTENTIONS.find(i => i.id === intentId);
    products = products.filter(p => p.intention === intentId);
    title = `${intent ? intent.icon : ''} ${intent ? intent.name : ''}`;
    subtitle = intent ? intent.desc : subtitle;
  }

  if (state.search) {
    products = products.filter(p =>
      (p.name && p.name.toLowerCase().includes(state.search)) ||
      (p.crystal && p.crystal.toLowerCase().includes(state.search)) ||
      (p.tagline && p.tagline.toLowerCase().includes(state.search)) ||
      (p.description && p.description.toLowerCase().includes(state.search))
    );
    title = 'Search Results';
    subtitle = `Showing ${products.length} result${products.length !== 1 ? 's' : ''} for "${escapeHtml(state.search)}"`;
  }

  if (state.priceRange && state.priceRange !== 'all') {
    const [min, max] = state.priceRange.split('-').map(Number);
    products = products.filter(p => {
      const price = p.variantPrices ? Math.min(...p.variantPrices) : p.price;
      if (max) return price >= min && price <= max;
      return price >= min;
    });
  }

  switch (state.sort) {
    case 'price-asc':
      products.sort((a, b) => {
        const pa = a.variantPrices ? Math.min(...a.variantPrices) : a.price;
        const pb = b.variantPrices ? Math.min(...b.variantPrices) : b.price;
        return pa - pb;
      }); break;
    case 'price-desc':
      products.sort((a, b) => {
        const pa = a.variantPrices ? Math.max(...a.variantPrices) : a.price;
        const pb = b.variantPrices ? Math.max(...b.variantPrices) : b.price;
        return pb - pa;
      }); break;
    case 'newest':
      products.sort((a, b) => b.id.localeCompare(a.id)); break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating); break;
    default:
      products.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
  }

  const activeBtn = (key, val) => key === val ? 'border-color:var(--color-primary);color:var(--color-primary);' : '';

  const filterBar = `
    <div class="shop-filters" style="display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;justify-content:center;">
      <button class="btn btn-outline" style="padding:8px 20px;font-size:13px;${activeBtn(state.filter, 'all')}" onclick="navigate('shop','all')">All</button>
      ${CATEGORIES.map(c => `<button class="btn btn-outline" style="padding:8px 20px;font-size:13px;${activeBtn(state.filter, 'category:' + c.id)}" onclick="navigate('shop','category:${c.id}')">${c.name}</button>`).join('')}
    </div>
  `;

  const toolbar = `
    <div class="shop-toolbar" style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;flex:1;min-width:220px;">
        <input type="text" id="shopSearch" placeholder="Search crystals..." value="${escapeHtml(state.search)}"
          oninput="setShopSearch(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();setShopSearch(this.value);}"
          style="padding:9px 14px;border:1px solid var(--color-border);border-radius:var(--radius-md);font-family:inherit;font-size:14px;background:var(--color-bg);color:var(--color-text);min-width:180px;width:100%;max-width:320px;">
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
        <select id="shopSort" onchange="setShopSort(this.value)" aria-label="Sort products"
          style="padding:9px 14px;border:1px solid var(--color-border);border-radius:var(--radius-md);font-family:inherit;font-size:14px;background:var(--color-bg);color:var(--color-text);cursor:pointer;">
          <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Sort: Featured</option>
          <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
          <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
          <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="rating" ${state.sort === 'rating' ? 'selected' : ''}>Best Rated</option>
        </select>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;${activeBtn(state.priceRange, 'all')}" onclick="setShopPrice('all')">All</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;${activeBtn(state.priceRange, '0-50')}" onclick="setShopPrice('0-50')">Under $50</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;${activeBtn(state.priceRange, '50-80')}" onclick="setShopPrice('50-80')">$50–$80</button>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:13px;${activeBtn(state.priceRange, '80-9999')}" onclick="setShopPrice('80-9999')">Over $80</button>
      </div>
    </div>
  `;

  const shopContent = document.getElementById('shopContent');
  shopContent.innerHTML = `
    <div class="container">
      <div style="text-align:center;margin-bottom:16px;">
        <h2 class="section-title" style="margin-bottom:8px;">${title}</h2>
        <p class="section-subtitle" style="margin-bottom:0;">${subtitle}</p>
      </div>
      ${filterBar}
      ${toolbar}
      <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:12px;">${products.length} product${products.length !== 1 ? 's' : ''}</div>
      <div class="product-grid" id="shopProductGrid">
        ${products.map(p => productCardHTML(p, { showHeart: true })).join('')}
      </div>
      ${products.length === 0 ? '<p style="text-align:center;padding:60px;color:var(--color-text-muted);">No products match your filters.</p>' : ''}
    </div>
  `;

  attachProductCardHandlers();

  if (state.filter && state.filter.startsWith('category:')) {
    const catId = state.filter.split(':')[1];
    const cat = CATEGORIES.find(c => c.id === catId);
    setBreadcrumbSEO(cat
      ? [{ name: 'Home', url: '/' }, { name: cat.name, url: `/index.html?shop=category:${catId}` }]
      : [{ name: 'Home', url: '/' }, { name: title }]);
  } else if (state.filter && state.filter.startsWith('intention:')) {
    const intentId = state.filter.split(':')[1];
    const intent = INTENTIONS.find(i => i.id === intentId);
    setBreadcrumbSEO([{ name: 'Home', url: '/' }, { name: intent ? intent.name : title }]);
  } else {
    setBreadcrumbSEO([{ name: 'Home', url: '/' }, { name: title }]);
  }
}

// ===== Render Product Detail (Enhanced with crystal story, ritual, supplier) =====
function renderProductDetail(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  currentProduct = product;
  selectedVariant = {};
  qty = 1;

  const related = PRODUCTS.filter(p => p.intention === product.intention && p.id !== product.id).slice(0, 4);

  const breadcrumb = `
    <div class="breadcrumb">
      <a onclick="navigate('home')">Home</a> / 
      <a onclick="navigate('shop','category:${escapeHtml(product.category)}')">${escapeHtml(CATEGORIES.find(c => c.id === product.category)?.name || 'Shop')}</a> / 
      <span>${escapeHtml(product.name)}</span>
    </div>
  `;

  const gallery = `
    <div class="product-gallery">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" id="mainProductImage" decoding="async">
      ${product.images && product.images.length > 1 ? `
        <div class="product-gallery-thumbs">
          ${product.images.map((img, i) => `<img src="${escapeHtml(img)}" alt="${escapeHtml(product.name)} ${i+1}" class="${i === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${escapeHtml(img)}')" decoding="async">`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  const variants = product.variants ? product.variants.map(v => `
    <div class="variant-selector">
      <label>${escapeHtml(v.name)}</label>
      <div class="variant-options">
        ${v.options.map((opt, i) => `<div class="variant-option ${i === 0 ? 'selected' : ''}" onclick="selectVariant(this, '${escapeHtml(v.name)}', ${i}, '${escapeHtml(opt)}')">${escapeHtml(opt)}</div>`).join('')}
      </div>
    </div>
  `).join('') : '';

  if (product.variants) {
    product.variants.forEach(v => { selectedVariant[v.name] = { index: 0, value: v.options[0] }; });
  }

  const initialPrice = (product.variantPrices && product.variants) ? getSelectedVariantPrice() : product.price;
  const stockInfo = getStockStatus(product.stock);
  const priceHTML = product.compareAt && !product.variantPrices
    ? `<div class="product-detail-price" id="productDetailPrice">${formatPrice(initialPrice)} <span style="font-size:18px;color:var(--color-text-muted);text-decoration:line-through;">${formatPrice(product.compareAt)}</span></div>`
    : `<div class="product-detail-price" id="productDetailPrice">${formatPrice(initialPrice)}</div>`;

  // Crystal meta info
  const crystalMeta = `
    <div class="crystal-meta-grid">
      <div class="crystal-meta-item">
        <span class="crystal-meta-label">Crystal</span>
        <span class="crystal-meta-value">${escapeHtml(product.crystal) || '—'}</span>
      </div>
      <div class="crystal-meta-item">
        <span class="crystal-meta-label">Chakra</span>
        <span class="crystal-meta-value">${escapeHtml(product.chakra) || '—'}</span>
      </div>
      <div class="crystal-meta-item">
        <span class="crystal-meta-label">Element</span>
        <span class="crystal-meta-value">${escapeHtml(product.element) || '—'}</span>
      </div>
      <div class="crystal-meta-item">
        <span class="crystal-meta-label">Ruling Planet</span>
        <span class="crystal-meta-value">${escapeHtml(product.planet) || '—'}</span>
      </div>
    </div>
  `;

  // Ritual box
  const ritualBox = product.ritual ? `
    <div class="crystal-ritual-box">
      <h4>🔮 Ritual & Activation</h4>
      <p>${escapeHtml(product.ritual)}</p>
    </div>
  ` : '';

  document.getElementById('productDetailContent').innerHTML = `
    ${breadcrumb}
    <div class="product-detail-grid" data-product-id="${escapeHtml(product.id)}">
      ${gallery}
      <div class="product-detail-info">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
          <h1 style="margin:0;">${escapeHtml(product.name)}</h1>
          <button class="wishlist-btn wishlist-large" data-wishlist-id="${escapeHtml(product.id)}" onclick="event.stopPropagation(); toggleWishlist('${escapeHtml(product.id)}')">${isWishlisted(product.id) ? '♥' : '♡'}</button>
        </div>
        <p class="product-detail-tagline">${escapeHtml(product.tagline)}</p>
        ${Number(product.reviews) > 0 ? `
        <div class="product-detail-rating">
          <span class="stars" style="font-size:18px;">${getStars(product.rating)}</span>
          <span style="font-size:13px;color:var(--color-text-muted);">${escapeHtml(product.rating)} • ${escapeHtml(product.reviews)} reviews</span>
        </div>
        ` : `
        <div class="product-detail-rating">
          <a href="#productReviews" onclick="event.preventDefault(); scrollToReviewForm();" style="font-size:13px;color:var(--admin-primary-dark);font-weight:600;text-decoration:none;cursor:pointer;">⭐ Be the first to review this product</a>
        </div>
        `}
        ${priceHTML}
        ${crystalMeta}
        <p class="product-detail-desc">${escapeHtml(product.description)}</p>
        ${ritualBox}
        <div class="product-properties">
          <h4>✦ Energy Properties</h4>
          <ul>
            ${product.properties.map(prop => `<li>${escapeHtml(prop)}</li>`).join('')}
          </ul>
        </div>
        ${variants}
        <div class="stock-status stock-${escapeHtml(stockInfo.cls)}" id="stockStatus">
          <span class="stock-dot"></span>${escapeHtml(stockInfo.label)}
        </div>
        ${variants ? `<div class="size-guide-row"><button type="button" class="size-guide-btn" onclick="openSizeGuide('${escapeHtml(product.category)}')">📏 Size Guide</button></div>` : ''}
        <div style="display:flex;gap:16px;align-items:center;margin:18px 0 8px;">
          <div class="qty-selector">
            <button onclick="changeQty(-1)">−</button>
            <input type="number" id="qtyInput" value="1" min="1" onchange="syncQty(this.value)">
            <button onclick="changeQty(1)">+</button>
          </div>
          <span id="stockCount" style="font-size:13px;color:var(--color-text-muted);">${escapeHtml(product.stock)} in stock</span>
        </div>
        <div id="productQtyTotal" class="product-qty-total" style="margin-bottom:12px;font-size:14px;color:var(--color-text-muted);">1 × ${formatPrice(initialPrice)} = ${formatPrice(initialPrice)}</div>
        <button id="addToCartBtn" class="btn btn-dark btn-lg btn-full" onclick="addToCartDetail()" style="margin-bottom:16px;${stockInfo.cls === 'out' ? 'opacity:.5;cursor:not-allowed;' : ''}" ${stockInfo.cls === 'out' ? 'disabled' : ''}>${stockInfo.cls === 'out' ? 'Sold Out' : 'Add to Cart • ' + formatPrice(initialPrice)}</button>
        <button class="btn btn-outline btn-full" onclick="buyNowDetail()">Buy It Now</button>
        <div style="margin-top:24px;padding:16px;background:var(--color-bg-alt);border-radius:var(--radius-md);font-size:13px;color:var(--color-text-muted);">
          <div style="margin-bottom:6px;">🚚 <strong>Free shipping</strong> on orders over $50</div>
          <div style="margin-bottom:6px;">↩️ <strong>14-day returns</strong> — easy &amp; hassle-free</div>
          <div>💎 <strong>100% genuine crystals</strong> — ethically sourced from 1688 verified suppliers</div>
        </div>
      </div>
    </div>
    <div id="productReviews" class="product-reviews">
      <h3 class="section-title" style="font-size:28px;margin:64px 0 8px;">Customer Reviews</h3>
      <div id="reviewsContent"><p class="reviews-loading">Loading reviews…</p></div>
    </div>
    ${related.length > 0 ? `
      <div style="max-width:1280px;margin:64px auto 0;padding:0 24px;">
        <h3 class="section-title" style="font-size:28px;margin-bottom:32px;">You May Also Like</h3>
        <div class="product-grid">
          ${related.map(p => productCardHTML(p, { showHeart: true })).join('')}
        </div>
      </div>
    ` : ''}
  `;

  attachProductCardHandlers();
  loadProductReviews(product.id);
  refreshProductStock(product.id);
  updateProductSEO(product);
}

function updateProductSEO(product) {
  if (!product) return;
  const base = window.location.origin;
  const url = `${base}/index.html?product=${encodeURIComponent(product.id)}`;
  const defaultImg = `${base}/images/og-default.png`;
  const img = product.image && !product.image.startsWith('http') ? base + product.image : (product.image || defaultImg);
  const desc = (product.tagline || product.description || '').slice(0, 160);
  const title = `${product.name} — Aurae`;
  const imgAlt = `${product.name} — Aurae crystal product image`;

  document.title = title;
  setMeta('description', desc);
  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:image', img.replace(/\.webp$/, '.png'), 'property');
  setMeta('og:image:width', '1200', 'property');
  setMeta('og:image:height', '630', 'property');
  setMeta('og:image:alt', imgAlt, 'property');
  setMeta('og:image:type', 'image/png', 'property');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', img.replace(/\.webp$/, '.png'));
  setMeta('twitter:image:alt', imgAlt);
  setCanonical(url);

  let ld = document.getElementById('aurae-jsonld');
  if (!ld) { ld = document.createElement('script'); ld.id = 'aurae-jsonld'; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
  const price = getSelectedVariantPrice();
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: Array.isArray(product.images) && product.images.length ? product.images.map(i => i.startsWith('http') ? i : base + i) : [img],
    description: desc,
    brand: { '@type': 'Brand', name: 'Aurae' },
    offers: {
      '@type': 'Offer',
      url: url,
      priceCurrency: 'USD',
      price: String(price),
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Aurae' }
    },
    aggregateRating: product.rating ? {
      '@type': 'AggregateRating',
      ratingValue: String(product.rating),
      reviewCount: String(product.reviews || 0)
    } : undefined
  };
  if (!schema.aggregateRating) delete schema.aggregateRating;
  ld.textContent = JSON.stringify(schema);

  const cat = CATEGORIES.find(c => c.id === product.category);
  setBreadcrumbSEO([
    { name: 'Home', url: '/' },
    ...(cat ? [{ name: cat.name, url: `/index.html?shop=category:${product.category}` }] : []),
    { name: product.name }
  ]);
}

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function setCanonical(url) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
  el.setAttribute('href', url);
}

// Manage multiple JSON-LD blocks by key (so product + breadcrumb + blog can coexist).
function setJsonLd(key, data) {
  const id = 'ld-' + key;
  if (!data) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
    return;
  }
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// Emit a BreadcrumbList structured-data block for the current view.
function setBreadcrumbSEO(items) {
  if (!items || !items.length) { setJsonLd('breadcrumb', null); return; }
  const base = window.location.origin;
  const list = items.map((it, i) => {
    const li = { '@type': 'ListItem', position: i + 1, name: it.name };
    if (it.url) li.item = it.url.startsWith('http') ? it.url : base + it.url;
    return li;
  });
  setJsonLd('breadcrumb', {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: list
  });
}

// Per-view SEO metadata so each SPA view has its own title/description/OG/canonical
// (instead of the whole site inheriting the homepage's meta + canonical).
const SEO_VIEWS = {
  home: {
    title: 'Aurae — Where Energy Meets Well-Being',
    desc: 'Shop healing crystals, crystal jewelry, and energy tools. Where energy meets well-being.',
    canonical: '/'
  },
  shop: {
    title: 'Shop Crystals & Healing Jewelry — Aurae',
    desc: 'Browse authentic healing crystals, crystal jewelry, and energy tools by category. Find the perfect stone for your intention.',
    canonical: '/index.html?shop=all'
  },
  about: {
    title: 'About Aurae — Our Story & Craft',
    desc: 'Learn about Aurae: our mission, our ethically-sourced crystals, and the intention behind every piece we craft.',
    canonical: '/index.html?view=about'
  },
  contact: {
    title: 'Contact Aurae — We’re Here to Help',
    desc: 'Get in touch with the Aurae team for order questions, custom requests, or crystal guidance.',
    canonical: '/contact.html'
  },
  track: {
    title: 'Track Your Order — Aurae',
    desc: 'Track your Aurae crystal order status, shipping updates, and delivery information.',
    canonical: '/index.html?view=track'
  }
};

function updateViewSEO(view, param) {
  const meta = SEO_VIEWS[view];
  if (!meta) return;
  let canonical = meta.canonical;
  if (view === 'shop' && param && param !== 'all') canonical = `/index.html?shop=${encodeURIComponent(param)}`;
  const fullUrl = window.location.origin + canonical;
  const base = window.location.origin;
  const defaultImg = `${base}/images/og-default.png`;
  const imgAlt = 'Aurae — Where Energy Meets Well-Being. Healing crystals and crystal jewelry.';
  document.title = meta.title;
  setMeta('description', meta.desc);
  setMeta('og:title', meta.title, 'property');
  setMeta('og:description', meta.desc, 'property');
  setMeta('og:url', fullUrl, 'property');
  setMeta('og:image', defaultImg, 'property');
  setMeta('og:image:width', '1200', 'property');
  setMeta('og:image:height', '630', 'property');
  setMeta('og:image:alt', imgAlt, 'property');
  setMeta('og:image:type', 'image/png', 'property');
  setMeta('twitter:title', meta.title);
  setMeta('twitter:description', meta.desc);
  setMeta('twitter:image', defaultImg);
  setMeta('twitter:image:alt', imgAlt);
  setCanonical(fullUrl);
}

// Pull the live (server-authoritative) stock for a product detail page.
function refreshProductStock(productId) {
  fetch(`/api/products/${encodeURIComponent(productId)}`)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      // Merge server-side variant stock into the in-memory product so selectors use live data.
      const product = PRODUCTS.find(p => p.id === productId);
      if (product && data.variantStock) product.variantStock = data.variantStock;
      updateStockDisplay();
    })
    .catch(() => {});
}

function updateStockDisplay() {
  const stock = getSelectedVariantStock();
  const info = getStockStatus(stock);
  const el = document.getElementById('stockStatus');
  if (el) { el.className = `stock-status stock-${info.cls}`; el.innerHTML = `<span class="stock-dot"></span>${info.label}`; }
  const count = document.getElementById('stockCount');
  if (count) count.textContent = `${stock} in stock`;
  const btn = document.getElementById('addToCartBtn');
  if (btn) {
    if (info.cls === 'out') {
      btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'not-allowed'; btn.textContent = 'Sold Out';
    } else {
      btn.disabled = false; btn.style.opacity = '1'; btn.style.cursor = 'pointer';
      updateProductPriceDisplay();
    }
  }
}

// ===== Render Blog Detail =====
function renderBlogDetail(blogId) {
  const blog = BLOG_POSTS.find(b => b.id === blogId);
  if (!blog) return;

  const relatedProductIds = {
    b1: ['p013','p001','p005'],
    b2: ['p007','p008','p012'],
    b3: ['p001','p004','p009','p013'],
    b4: ['p005','p006','p013','p003']
  };
  const relatedProducts = PRODUCTS.filter(p => (relatedProductIds[blog.id] || []).includes(p.id)).slice(0, 4);

  document.getElementById('blogDetailContent').innerHTML = `
    <section class="hero" style="height:400px;">
      <div class="hero-bg" style="background: linear-gradient(135deg, rgba(74,93,62,0.78) 0%, rgba(201,169,110,0.35) 100%), url('${escapeHtml(blog.image)}') center/cover;"></div>
      <div class="hero-content">
        <div class="blog-meta" style="text-transform:uppercase;letter-spacing:2px;font-size:13px;margin-bottom:16px;color:#fff;opacity:0.95;">${escapeHtml(blog.category)} • ${escapeHtml(blog.readTime)}</div>
        <h1 style="max-width:860px;font-size:42px;">${escapeHtml(blog.title)}</h1>
      </div>
    </section>
    <div class="container blog-detail-container">
      <div class="breadcrumb" style="margin-bottom:28px;">
        <a onclick="navigate('home')">Home</a> / <a onclick="navigate('home'); setTimeout(() => { const el = document.getElementById('blogGrid'); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 100);">Journal</a> / <span>${escapeHtml(blog.title)}</span>
      </div>
      <article class="blog-detail-body">
        ${blog.content}
      </article>
      <div class="blog-detail-cta">
        <h3>Bring These Energies Into Your Life</h3>
        <p>Explore the crystals mentioned in this guide and find the piece that resonates with your intention.</p>
        <button class="btn btn-dark btn-lg" onclick="navigate('shop','all')">Shop Crystals</button>
      </div>
      ${relatedProducts.length > 0 ? `
        <div class="blog-detail-related">
          <h3 class="section-title" style="font-size:28px;margin-bottom:32px;">Featured Crystals From This Guide</h3>
          <div class="product-grid">
            ${relatedProducts.map(p => productCardHTML(p, { showHeart: true })).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  attachProductCardHandlers();
  updateBlogSEO(blog);
}

// ===== Order Tracking Page =====
function renderTrack(param) {
  const container = document.getElementById('trackContent');
  if (!container) return;

  let initialOrderId = '';
  let initialEmail = '';
  if (param && param.includes('|')) {
    const [oid, em] = param.split('|');
    initialOrderId = oid || '';
    initialEmail = em || '';
  }

  container.innerHTML = `
    <section class="hero" style="height:320px;">
      <div class="hero-bg" style="background: linear-gradient(135deg, rgba(74,93,62,0.8) 0%, rgba(201,169,110,0.5) 100%), url('/images/p001.webp') center/cover;"></div>
      <div class="hero-content">
        <h1 style="font-size:40px;">Track Your Order</h1>
        <p>Enter your order ID and email to see the latest status.</p>
      </div>
    </section>
    <section class="section">
      <div class="container" style="max-width:720px;">
        <div class="breadcrumb" style="margin-bottom:28px;">
          <a onclick="navigate('home')">Home</a> / <span>Track Order</span>
        </div>
        <form id="trackForm" onsubmit="submitTrack(event)" style="background:var(--color-bg-alt);padding:32px;border-radius:var(--radius-md);margin-bottom:32px;">
          <div class="form-row">
            <div class="form-group" style="flex:1;">
              <label for="trackOrderId">Order ID</label>
              <input type="text" id="trackOrderId" required placeholder="e.g. ORD-20260818-ABCD" value="${escapeHtml(initialOrderId)}">
            </div>
            <div class="form-group" style="flex:1;">
              <label for="trackEmail">Email</label>
              <input type="email" id="trackEmail" required placeholder="your@email.com" value="${escapeHtml(initialEmail)}">
            </div>
          </div>
          <button type="submit" class="btn btn-dark btn-full btn-lg" id="trackSubmitBtn">Track Order</button>
        </form>
        <div id="trackResult" style="display:none;"></div>
      </div>
    </section>
  `;

  if (initialOrderId && initialEmail) submitTrack({ preventDefault: () => {} });
}

async function submitTrack(e) {
  e.preventDefault();
  const btn = document.getElementById('trackSubmitBtn');
  const result = document.getElementById('trackResult');
  const orderId = document.getElementById('trackOrderId').value.trim();
  const email = document.getElementById('trackEmail').value.trim();
  if (!orderId || !email) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Tracking...'; }
  try {
    const res = await fetch(`/api/track?orderId=${encodeURIComponent(orderId)}&email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Tracking failed');
    const o = data.order;
    const statusLabel = { paid: 'Payment Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled', refunded: 'Refunded', pending: 'Pending Payment', unpaid: 'Awaiting Payment' }[o.status] || o.status;
    const statusStep = ['unpaid', 'pending'].includes(o.status) ? 1 : o.status === 'paid' ? 2 : o.status === 'shipped' ? 3 : o.status === 'delivered' ? 4 : 0;
    const stepDot = (n, label) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;opacity:${statusStep >= n ? 1 : 0.35};"><div style="width:28px;height:28px;border-radius:50%;background:${statusStep >= n ? 'var(--color-primary)' : 'var(--color-border)'};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;">${n}</div><div style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${label}</div></div>`;
    result.style.display = 'block';
    result.innerHTML = `
      <div style="background:var(--color-bg);border:1px solid var(--color-border);border-radius:var(--radius-md);padding:28px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:20px;">
          <div>
            <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:4px;">Order ${escapeHtml(o.orderId)}</div>
            <div style="font-size:24px;font-weight:600;">${statusLabel}</div>
            <div style="font-size:13px;color:var(--color-text-muted);margin-top:4px;">Placed on ${formatDate(o.createdAt)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:22px;font-weight:600;">${formatPrice(o.total)}</div>
            <div style="font-size:13px;color:var(--color-text-muted);">${o.items ? o.items.length : 0} item(s)</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin:28px 0;">
          ${stepDot(1, 'Ordered')}${stepDot(2, 'Confirmed')}${stepDot(3, 'Shipped')}${stepDot(4, 'Delivered')}
        </div>
        ${o.trackingNumber ? `<div style="background:var(--color-bg-alt);padding:16px;border-radius:var(--radius-md);margin-bottom:16px;"><strong>Tracking:</strong> ${escapeHtml(o.carrier || 'Standard Shipping')} — <code style="font-family:inherit;background:#fff;padding:2px 6px;border-radius:4px;">${escapeHtml(o.trackingNumber)}</code></div>` : ''}
        <div style="font-size:14px;color:var(--color-text-muted);margin-bottom:16px;">Estimated delivery: <strong>${formatDate(o.estimatedDelivery)}</strong></div>
        <h4 style="margin:24px 0 12px;">Items</h4>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${(o.items || []).map(item => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--color-bg-alt);border-radius:var(--radius-md);">
              <div>
                <div style="font-weight:500;">${escapeHtml(item.name)}</div>
                ${item.variant ? `<div style="font-size:13px;color:var(--color-text-muted);">${escapeHtml(item.variant)} × ${item.qty}</div>` : `<div style="font-size:13px;color:var(--color-text-muted);">Qty: ${item.qty}</div>`}
              </div>
              <div style="font-weight:600;">${formatPrice(item.price * item.qty)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    if (btn) btn.textContent = 'Track Order';
  } catch (err) {
    result.style.display = 'block';
    result.innerHTML = `<div style="color:var(--color-danger);padding:16px;background:#fff0f0;border-radius:var(--radius-md);border:1px solid var(--color-danger);">${escapeHtml(err.message)}</div>`;
    if (btn) btn.textContent = 'Track Order';
  } finally {
    if (btn) btn.disabled = false;
  }
}

function updateBlogSEO(blog) {
  if (!blog) return;
  const base = window.location.origin;
  const url = `${base}/index.html?blog=${encodeURIComponent(blog.id)}`;
  const img = (blog.image && blog.image.startsWith('/')) ? base + blog.image : (blog.image || `${base}/images/og-default.png`);
  const title = `${blog.title} — Aurae`;
  const desc = (blog.excerpt || blog.title || '').slice(0, 160);

  document.title = title;
  setMeta('description', desc);
  setMeta('og:title', title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:url', url, 'property');
  setMeta('og:image', img.replace(/\.webp$/, '.png'), 'property');
  setMeta('og:image:width', '1200', 'property');
  setMeta('og:image:height', '630', 'property');
  setMeta('og:image:alt', `${blog.title} — Aurae`, 'property');
  setMeta('og:image:type', 'image/png', 'property');
  setMeta('twitter:title', title);
  setMeta('twitter:description', desc);
  setMeta('twitter:image', img.replace(/\.webp$/, '.png'));
  setMeta('twitter:image:alt', `${blog.title} — Aurae`);
  setCanonical(url);

  setJsonLd('blog', {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blog.title,
    description: desc,
    image: img,
    datePublished: '2026-08-08',
    dateModified: '2026-08-14',
    author: { '@type': 'Organization', name: 'Aurae' },
    publisher: {
      '@type': 'Organization',
      name: 'Aurae',
      logo: { '@type': 'ImageObject', url: `${base}/images/og-default.png` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url }
  });

  setBreadcrumbSEO([
    { name: 'Home', url: '/' },
    { name: blog.title }
  ]);
}

function changeMainImage(el, src) {
  document.getElementById('mainProductImage').src = src;
  document.querySelectorAll('.product-gallery-thumbs img').forEach(img => img.classList.remove('active'));
  el.classList.add('active');
}

function getSelectedVariantPrice() {
  const product = currentProduct;
  if (!product) return 0;
  if (Array.isArray(product.variantPrices) && product.variants) {
    for (const v of product.variants) {
      const sel = selectedVariant[v.name];
      const idx = (sel && typeof sel === 'object') ? sel.index : 0;
      if (product.variantPrices[idx] != null) {
        return product.variantPrices[idx];
      }
    }
  }
  return product.price;
}

function getSelectedVariantKey() {
  const product = currentProduct;
  if (!product || !product.variants) return '';
  return Object.entries(selectedVariant).map(([k, v]) => `${k}:${(v && typeof v === 'object') ? v.value : v}`).join('|');
}

function getSelectedVariantStock() {
  const product = currentProduct;
  if (!product) return 0;
  const vKey = getSelectedVariantKey();
  if (product.variantStock && vKey && product.variantStock[vKey] != null) {
    return Number(product.variantStock[vKey]) || 0;
  }
  return Number(product.stock) || 0;
}

function updateProductPriceDisplay() {
  const price = getSelectedVariantPrice();
  const priceEl = document.getElementById('productDetailPrice');
  // Preserve the "compare at" strikethrough if present.
  if (priceEl && !priceEl.querySelector('span[style*="line-through"]')) {
    priceEl.textContent = formatPrice(price);
  }
  const total = price * qty;
  const btn = document.getElementById('addToCartBtn');
  if (btn && !btn.disabled) {
    btn.textContent = `Add to Cart • ${formatPrice(total)}`;
  }
  const totalEl = document.getElementById('productQtyTotal');
  if (totalEl) totalEl.textContent = `${qty} × ${formatPrice(price)} = ${formatPrice(total)}`;
}

function selectVariant(el, name, index, value) {
  el.parentElement.querySelectorAll('.variant-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedVariant[name] = { index, value };
  updateStockDisplay();
}

function changeQty(delta) {
  const max = currentProduct && getSelectedVariantStock() > 0 ? getSelectedVariantStock() : Infinity;
  qty = Math.min(max, Math.max(1, qty + delta));
  const input = document.getElementById('qtyInput');
  if (input) input.value = qty;
  updateProductPriceDisplay();
}

function syncQty(val) {
  const max = currentProduct && getSelectedVariantStock() > 0 ? getSelectedVariantStock() : Infinity;
  qty = Math.min(max, Math.max(1, parseInt(val) || 1));
  const input = document.getElementById('qtyInput');
  if (input) input.value = qty;
  updateProductPriceDisplay();
}

function addToCartDetail() {
  if (!currentProduct) return;
  const available = getSelectedVariantStock();
  if (available < qty) {
    showToast(`Only ${available} available for the selected option.`);
    return;
  }
  const variantKey = Object.entries(selectedVariant).map(([k, v]) => `${k}:${v.value || v}`).join('|');
  addToCart({
    id: currentProduct.id,
    name: currentProduct.name,
    price: getSelectedVariantPrice(),
    image: currentProduct.image,
    tagline: currentProduct.tagline,
    qty: qty,
    variant: variantKey
  });
  showToast(`${currentProduct.name} added to cart`);
  openCart();
}

function buyNowDetail() {
  addToCartDetail();
  closeCart();
  navigate('checkout');
}

// ===== Cart Functions =====
function getVariantStockFrontend(product, variant) {
  if (!product) return 0;
  if (product.variantStock && variant && product.variantStock[variant] != null) {
    return Number(product.variantStock[variant]) || 0;
  }
  return Number(product.stock) || 0;
}

function quickAddToCart(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  let variant = '';
  let price = product.price;
  if (product.variants) {
    const firstVariants = {};
    product.variants.forEach(v => { firstVariants[v.name] = v.options[0]; });
    variant = Object.entries(firstVariants).map(([k, v]) => `${k}:${v}`).join('|');
    if (Array.isArray(product.variantPrices) && product.variantPrices[0] != null) {
      price = product.variantPrices[0];
    }
  }
  const available = getVariantStockFrontend(product, variant);
  const existing = cart.find(c => c.id === product.id && c.variant === variant);
  const currentQty = existing ? existing.qty : 0;
  if (available < currentQty + 1) {
    showToast(`Only ${available} available for ${product.name}${variant ? ' (' + variant + ')' : ''}.`);
    return;
  }
  addToCart({
    id: product.id,
    name: product.name,
    price: price,
    image: product.image,
    tagline: product.tagline,
    qty: 1,
    variant: variant
  });
  showToast(`${product.name} added to cart`);
  openCart();
}

function addToCart(item) {
  const product = PRODUCTS.find(p => p.id === item.id);
  const existing = cart.find(c => c.id === item.id && c.variant === item.variant);
  const available = getVariantStockFrontend(product, item.variant);
  const requested = (existing ? existing.qty : 0) + item.qty;
  if (product && requested > available) {
    showToast(`Only ${available} available for ${product.name}${item.variant ? ' (' + item.variant + ')' : ''}.`);
    return;
  }
  if (existing) {
    existing.qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart();
  renderCart();
  pintrkTrack('addtocart', {
    value: Number(item.price) * Number(item.qty),
    order_quantity: Number(item.qty),
    currency: 'USD',
    line_items: [{
      product_name: item.name,
      product_id: String(item.id),
      product_category: product?.category || '',
      product_price: Number(item.price) || 0,
      product_quantity: Number(item.qty) || 1
    }]
  });
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function changeCartQty(index, delta) {
  const item = cart[index];
  if (!item) return;
  const product = PRODUCTS.find(p => p.id === item.id);
  const available = getVariantStockFrontend(product, item.variant);
  const newQty = item.qty + delta;
  if (newQty > available) {
    showToast(`Only ${available} available for ${item.name}${item.variant ? ' (' + item.variant + ')' : ''}.`);
    return;
  }
  item.qty = Math.max(1, newQty);
  saveCart();
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  if (!cartItems || !cartFooter) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div class="icon">🛍️</div>
        <p>Your cart is empty</p>
        <p style="font-size:13px;margin-top:8px;">Start shopping to fill it with crystal energy!</p>
      </div>
    `;
    cartFooter.style.display = 'none';
    return;
  }

  cartItems.innerHTML = cart.map((item, i) => `
    <div class="cart-item">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
      <div class="cart-item-info">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-tagline">${escapeHtml(item.tagline)}</div>
        ${item.variant ? `<div class="cart-item-variant">${escapeHtml(item.variant)}</div>` : ''}
        <div class="cart-item-bottom">
          <div class="cart-qty">
            <button onclick="changeCartQty(${i}, -1)">−</button>
            <span>${escapeHtml(item.qty)}</span>
            <button onclick="changeCartQty(${i}, 1)">+</button>
          </div>
          <div class="cart-item-price">${formatPrice(item.price * item.qty)}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart(${i})">Remove</button>
      </div>
    </div>
  `).join('');

  const { subtotal, shipping, discount, tax, total } = getCartTotals();
  const freeShipping = subtotal >= 50;

  cartFooter.style.display = 'block';
  cartFooter.innerHTML = `
    ${freeShipping
      ? '<div class="cart-shipping-note">✓ You qualify for FREE shipping!</div>'
      : `<div class="cart-shipping-note" style="color:var(--color-text-muted);">Add ${formatPrice(50 - subtotal)} more for FREE shipping</div>`
    }
    <div class="cart-coupon">
      <label>Promo Code</label>
      <div class="cart-coupon-row">
        <input type="text" id="couponInput" placeholder="CRYSTAL10" value="${cartCoupon.applied ? cartCoupon.code : ''}" ${cartCoupon.applied ? 'disabled' : ''}>
        <button class="btn btn-outline" onclick="${cartCoupon.applied ? 'removeCoupon()' : 'applyCoupon()'}" id="couponApplyBtn">${cartCoupon.applied ? 'Remove' : 'Apply'}</button>
      </div>
      <div id="couponMessage" class="coupon-message"></div>
      ${cartCoupon.applied ? `<div class="coupon-applied">✓ <strong>${cartCoupon.code}</strong> — 10% first-order discount</div>` : '<div class="coupon-hint">First order only • Use code CRYSTAL10 for 10% off</div>'}
    </div>
    <div class="cart-mini-totals">
      <div class="cart-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
      ${discount > 0 ? `<div class="cart-row discount"><span>Discount (${cartCoupon.code})</span><span>-${formatPrice(discount)}</span></div>` : ''}
      <div class="cart-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
      <div class="cart-row"><span>Tax</span><span>${formatPrice(tax)}</span></div>
      <div class="cart-row total"><span>Estimated Total</span><span>${formatPrice(total)}</span></div>
    </div>
    <button class="btn btn-dark btn-full btn-lg" onclick="closeCart(); navigate('checkout');">Checkout • ${formatPrice(total)}</button>
    <button class="btn btn-outline btn-full" style="margin-top:8px;" onclick="closeCart(); navigate('shop');">Continue Shopping</button>
  `;
}

function openCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (!drawer || !overlay) {
    window.location.href = 'index.html';
    return;
  }
  drawer.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  if (drawer) drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== Energy Profile Quiz =====
function initQuiz() {
  quizStep = 0;
  quizAnswers = [];
  quizScores = {};
  renderQuizStart();
}

function renderQuizStart() {
  const container = document.getElementById('quizContainer');
  container.innerHTML = `
    <div class="quiz-start" id="quizStart">
      <div class="quiz-icon">🔮</div>
      <h3>Discover Your Crystal Match</h3>
      <p>Answer 6 intuitive questions and let the crystals reveal what your energy field is calling for. Our analysis reads your energetic blueprint and matches you with the crystals that will best support your journey.</p>
      <button class="btn btn-dark btn-lg" onclick="startQuiz()">Begin My Reading</button>
    </div>
  `;
}

function startQuiz() {
  quizStep = 0;
  quizAnswers = [];
  quizScores = {};
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const container = document.getElementById('quizContainer');
  const q = QUIZ_QUESTIONS[quizStep];

  const progressDots = QUIZ_QUESTIONS.map((_, i) => {
    if (i < quizStep) return '<div class="quiz-progress-dot completed"></div>';
    if (i === quizStep) return '<div class="quiz-progress-dot active"></div>';
    return '<div class="quiz-progress-dot"></div>';
  }).join('');

  container.innerHTML = `
    <div class="quiz-step active">
      <div class="quiz-progress">${progressDots}</div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-subtitle">${q.subtitle}</div>
      <div class="quiz-options" id="quizOptions">
        ${q.options.map((opt, i) => `
          <div class="quiz-option" data-index="${i}" onclick="selectQuizAnswer(${i})">
            <span class="option-icon">${opt.icon}</span>
            <span class="option-label">${opt.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="quiz-nav">
        ${quizStep > 0 ? `<button class="btn btn-outline" onclick="prevQuizQuestion()">← Back</button>` : '<div></div>'}
        <button class="btn btn-dark" id="quizNextBtn" style="opacity:0.4;pointer-events:none;" onclick="nextQuizQuestion()">Next →</button>
      </div>
    </div>
  `;
}

function selectQuizAnswer(optionIndex) {
  // Mark selected
  document.querySelectorAll('.quiz-option').forEach((el, i) => {
    el.classList.toggle('selected', i === optionIndex);
  });

  // Store answer
  quizAnswers[quizStep] = optionIndex;

  // Enable next button
  const nextBtn = document.getElementById('quizNextBtn');
  nextBtn.style.opacity = '1';
  nextBtn.style.pointerEvents = 'auto';

  // Auto-advance after short delay
  setTimeout(() => {
    if (quizAnswers[quizStep] !== undefined) {
      nextQuizQuestion();
    }
  }, 600);
}

function nextQuizQuestion() {
  if (quizAnswers[quizStep] === undefined) return;

  // Record scores
  const q = QUIZ_QUESTIONS[quizStep];
  const answer = q.options[quizAnswers[quizStep]];
  for (const [key, value] of Object.entries(answer.value)) {
    quizScores[key] = (quizScores[key] || 0) + value;
  }

  quizStep++;
  if (quizStep >= QUIZ_QUESTIONS.length) {
    renderQuizResult();
  } else {
    renderQuizQuestion();
  }
}

function prevQuizQuestion() {
  if (quizStep > 0) {
    // Undo scores from current answer
    if (quizAnswers[quizStep] !== undefined) {
      const q = QUIZ_QUESTIONS[quizStep];
      const answer = q.options[quizAnswers[quizStep]];
      for (const [key, value] of Object.entries(answer.value)) {
        quizScores[key] = (quizScores[key] || 0) - value;
      }
    }
    quizStep--;
    renderQuizQuestion();
  }
}

function renderQuizResult() {
  const container = document.getElementById('quizContainer');

  // Find top 3 intentions
  const sortedScores = Object.entries(quizScores).sort((a, b) => b[1] - a[1]);
  const topIntent = sortedScores[0];
  const topIntentData = INTENTIONS.find(i => i.id === topIntent[0]);
  const maxScore = sortedScores.reduce((max, [_, v]) => Math.max(max, v), 0);

  // Get recommended products (top 3-4 matching products)
  const recommended = PRODUCTS
    .filter(p => p.intention === topIntent[0])
    .slice(0, 3);

  // Also add one from second intention if available
  if (sortedScores[1]) {
    const secondMatch = PRODUCTS.find(p => p.intention === sortedScores[1][0] && !recommended.includes(p));
    if (secondMatch) recommended.push(secondMatch);
  }

  // Profile descriptions
  const profiles = {
    love: {
      title: "The Heart-Seeker",
      desc: "Your energy field radiates with the frequency of love and connection. Your Heart Chakra is calling for activation — you're ready to open yourself to deeper relationships, heal past emotional wounds, and magnetize love in all its forms. The crystals below will support your heart's journey."
    },
    wealth: {
      title: "The Abundance Magnet",
      desc: "Your Solar Plexus is primed for activation. You carry the energetic signature of someone destined for prosperity — but you need crystals that will amplify your manifestation power and remove scarcity blocks. These stones will align you with the frequency of abundance."
    },
    protection: {
      title: "The Sacred Guardian",
      desc: "Your aura is sensitive and expansive — you feel everything. This is a gift, but it means you need powerful energetic protection. The crystals below will create an impenetrable shield around your energy field while grounding you into the Earth's protective embrace."
    },
    calm: {
      title: "The Peace-Seeker",
      desc: "Your nervous system is calling for serenity. The chaotic energy of the world has been affecting your inner landscape, and your being is requesting crystals that carry the frequency of deep, still calm. These stones will quiet your mind and soothe your spirit."
    },
    spirituality: {
      title: "The Seeker of Wisdom",
      desc: "Your Third Eye and Crown Chakras are awakening. You're being called to deepen your spiritual practice, explore the unseen realms, and connect with higher guidance. The crystals below will serve as your bridges between the earthly and the divine."
    },
    power: {
      title: "The Awakening Warrior",
      desc: "There's a fire building within you — a call to step into your full power. Your energy field is ready for activation, courage, and bold action. These crystals will fuel your transformation from who you've been into who you're becoming."
    },
    wellness: {
      title: "The Healing Journeyer",
      desc: "Your body and spirit are asking for nurturing and restoration. You've been giving too much and receiving too little. The crystals below will support your physical and emotional healing, helping you rebuild your vitality from the cellular level."
    },
    "fresh-start": {
      title: "The Phoenix Rising",
      desc: "You stand at the threshold of transformation. The old version of you is shedding, and a new self is emerging. These crystals will support your rebirth — clearing the past, igniting your renewal, and grounding your new beginning."
    }
  };

  const profile = profiles[topIntent[0]] || profiles.spirituality;

  // Save energy result for account page
  localStorage.setItem('auraeEnergyResult', JSON.stringify({
    icon: topIntentData.icon,
    title: profile.title,
    desc: profile.desc,
    intention: topIntent[0]
  }));

  // Energy bars HTML
  const energyBars = sortedScores.slice(0, 5).map(([intentId, score]) => {
    const intent = INTENTIONS.find(i => i.id === intentId);
    const pct = Math.round((score / maxScore) * 100);
    return `
      <div class="energy-bar">
        <div class="energy-bar-header">
          <span class="energy-bar-label">${intent.icon} ${intent.name}</span>
          <span class="energy-bar-value">${pct}%</span>
        </div>
        <div class="energy-bar-track">
          <div class="energy-bar-fill" style="width:0%;background:${intent.color};" data-width="${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  // Product cards
  const productCards = recommended.map((p, i) => `
    <div class="quiz-product-card" data-product-id="${p.id}">
      <img src="${p.image}" alt="${p.name}" loading="lazy" decoding="async">
      <div class="quiz-product-info">
        <div class="quiz-match-badge">${i === 0 ? '★ Best Match' : 'Recommended'}</div>
        <div class="quiz-product-name">${p.name}</div>
        <div class="quiz-product-price">${formatPrice(p.price)}</div>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="quiz-result active">
      <div class="quiz-result-header">
        <div class="result-icon">${topIntentData.icon}</div>
        <h3>${profile.title}</h3>
        <p>${profile.desc}</p>
      </div>
      <div class="quiz-energy-bars" id="energyBars">
        <h4 style="font-family:var(--font-sans);font-size:13px;text-transform:uppercase;letter-spacing:1px;color:var(--color-text-muted);margin-bottom:16px;text-align:center;">Your Energy Profile</h4>
        ${energyBars}
      </div>
      <div class="quiz-recommendations">
        <h4>✦ Crystals Matched For You</h4>
        <div class="quiz-products">
          ${productCards}
        </div>
      </div>
      <div style="text-align:center;margin-top:24px;">
        <button class="btn btn-outline" style="margin-right:8px;" onclick="startQuiz()">↻ Retake Quiz</button>
        <button class="btn btn-dark" onclick="navigate('shop','intention:${topIntent[0]}')">Shop All ${topIntentData.name} Crystals</button>
      </div>
    </div>
  `;

  // Animate energy bars
  setTimeout(() => {
    document.querySelectorAll('.energy-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 200);

  // Attach product card click handlers
  document.querySelectorAll('.quiz-product-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.productId;
      navigate('product', id);
    });
  });
}

// ===== Payment Configuration =====
let paymentConfig = null;

async function loadPaymentConfig() {
  if (paymentConfig) return paymentConfig;
  try {
    const resp = await fetch('/api/config');
    if (resp.ok) {
      paymentConfig = await resp.json();
    }
  } catch (e) {
    console.warn('Could not load payment config, running in demo mode');
  }
  return paymentConfig || {};
}

// ===== Checkout =====
let selectedPayment = 'paypal';
let paypalLoaded = false;

function renderCheckout() {
  const { subtotal, shipping, discount, tax, total } = getCartTotals();
  const user = JSON.parse(localStorage.getItem('auraeUser') || 'null');

  document.getElementById('checkoutContent').innerHTML = `
    <div class="breadcrumb">
      <a onclick="navigate('home')">Home</a> / 
      <a onclick="closeCart(); openCart();">Cart</a> / 
      <span>Checkout</span>
    </div>
    <div class="checkout-grid">
      <div class="checkout-form">
        <h2>Checkout</h2>
        <div id="paymentStatusBanner" style="display:none;"></div>
        <div class="form-section">
          <h3>Contact Information</h3>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="checkoutEmail" placeholder="your@email.com" value="${user ? escapeHtml(user.email) : ''}" required>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" id="checkoutPhone" placeholder="+1 (555) 000-0000">
          </div>
        </div>
        <div class="form-section">
          <h3>Shipping Address</h3>
          <div id="savedAddressSelector"></div>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="checkoutName" placeholder="Jane Doe" value="${user ? escapeHtml(user.name) : ''}" required>
          </div>
          <div class="form-group">
            <label>Address</label>
            <input type="text" id="checkoutAddress" placeholder="123 Crystal Lane" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>City</label>
              <input type="text" id="checkoutCity" placeholder="Los Angeles" required>
            </div>
            <div class="form-group">
              <label>State / Province</label>
              <input type="text" id="checkoutState" placeholder="CA" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>ZIP / Postal Code</label>
              <input type="text" id="checkoutZip" placeholder="90001" required>
            </div>
            <div class="form-group">
              <label>Country</label>
              <select id="checkoutCountry">
                <option>United States</option>
                <option>United Kingdom</option>
                <option>Canada</option>
                <option>Australia</option>
                <option>Germany</option>
                <option>France</option>
                <option>Other</option>
              </select>
            </div>
          </div>
        </div>
        <div class="form-section">
          <h3>Payment Method</h3>
          <div class="payment-methods">
            <div class="payment-method selected" style="cursor:default;">
              <div class="icon">🅿️</div>
              <div class="name">PayPal<br><small style="font-size:11px;color:var(--color-text-muted);">Pay with PayPal account or credit/debit card</small></div>
            </div>
          </div>
          <div id="paypalPaymentFields">
            <div id="paypalButtonContainer" style="min-height:80px;display:flex;align-items:center;justify-content:center;">
              <p style="font-size:13px;color:var(--color-text-muted);">Click "Place Order" below to pay securely with PayPal.</p>
            </div>
          </div>
        </div>
        <button class="btn btn-dark btn-lg btn-full" onclick="processOrder()" id="placeOrderBtn">
          Place Order • ${formatPrice(total)}
        </button>
        <div class="trust-badges">
          <div class="trust-badge">
            <span class="tb-icon">🔒</span>
            <span class="tb-text"><strong>SSL Encrypted</strong><small>256-bit secure checkout</small></span>
          </div>
          <div class="trust-badge">
            <span class="tb-icon">🛡️</span>
            <span class="tb-text"><strong>PayPal Protection</strong><small>Buyer &amp; fraud covered</small></span>
          </div>
          <div class="trust-badge">
            <span class="tb-icon">💎</span>
            <span class="tb-text"><strong>Genuine Crystals</strong><small>Hand-selected &amp; cleansed</small></span>
          </div>
          <div class="trust-badge">
            <span class="tb-icon">🌍</span>
            <span class="tb-text"><strong>Worldwide Shipping</strong><small>Tracked delivery</small></span>
          </div>
        </div>
        <p style="text-align:center;font-size:12px;color:var(--color-text-muted);margin-top:12px;">
          🔒 Your payment is processed securely by PayPal. We never store your financial details.
        </p>
      </div>
      <div class="order-summary">
        <h3>Order Summary</h3>
        <div class="summary-items">
          ${cart.map(item => `
            <div class="summary-item">
              <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" decoding="async">
              <div class="summary-item-info">
                <div class="summary-item-name">${escapeHtml(item.name)}</div>
                <div class="summary-item-qty">Qty: ${escapeHtml(item.qty)}</div>
              </div>
              <div class="summary-item-price">${formatPrice(item.price * item.qty)}</div>
            </div>
          `).join('')}
        </div>
        <div class="summary-totals">
          <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
          ${discount > 0 ? `<div class="summary-row discount"><span>Discount (${escapeHtml(cartCoupon.code)})</span><span>-${formatPrice(discount)}</span></div>` : ''}
          <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
          <div class="summary-row"><span>Tax (8%)</span><span>${formatPrice(tax)}</span></div>
          <div class="summary-row total"><span>Total</span><span>${formatPrice(total)}</span></div>
        </div>
        ${!cartCoupon.applied ? `
        <div class="checkout-coupon">
          <label>Have a promo code?</label>
          <div class="checkout-coupon-row">
            <input type="text" id="checkoutCouponInput" placeholder="CRYSTAL10">
            <button class="btn btn-outline" onclick="applyCheckoutCoupon()">Apply</button>
          </div>
          <div id="checkoutCouponMessage" class="coupon-message"></div>
          <p class="coupon-hint">First order only • 10% off with CRYSTAL10</p>
        </div>
        ` : `
        <div class="checkout-coupon">
          <div class="coupon-applied">✓ <strong>${escapeHtml(cartCoupon.code)}</strong> applied — 10% off first order <a onclick="removeCoupon(); renderCheckout();">Remove</a></div>
        </div>
        `}
        <div class="trust-returns">
          <span class="tb-icon">↩️</span>
          <span><strong>30-Day Easy Returns.</strong> Not in love with your crystals? Return within 30 days for a full refund — no questions asked.</span>
        </div>
      </div>
    </div>
  `;
  loadCheckoutAddresses();
}

async function loadCheckoutAddresses() {
  const container = document.getElementById('savedAddressSelector');
  if (!container) return;
  const token = getAuthToken();
  if (!token) { container.innerHTML = ''; return; }
  try {
    const resp = await fetch('/api/me/addresses', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { container.innerHTML = ''; return; }
    const data = await resp.json();
    const addresses = data.addresses || [];
    if (!addresses.length) { container.innerHTML = ''; return; }
    container.innerHTML = `
      <div class="form-group">
        <label>Use a saved address</label>
        <select id="checkoutSavedAddress" onchange="fillCheckoutAddress(this.value)">
          <option value="">-- Type manually --</option>
          ${addresses.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.label || 'Address')}${a.isDefault ? ' (Default)' : ''} — ${escapeHtml(a.line1)}, ${escapeHtml(a.city)}</option>`).join('')}
        </select>
      </div>
    `;
  } catch (e) { container.innerHTML = ''; }
}

function fillCheckoutAddress(id) {
  if (!id) return;
  const select = document.getElementById('checkoutSavedAddress');
  const option = select?.querySelector(`option[value="${CSS.escape(id)}"]`);
  if (!option) return;
  // addresses are not stored in DOM; fetch fresh
  const token = getAuthToken();
  fetch('/api/me/addresses', { headers: { 'Authorization': 'Bearer ' + token } })
    .then(r => r.json())
    .then(data => {
      const a = (data.addresses || []).find(x => x.id === id);
      if (!a) return;
      document.getElementById('checkoutName').value = a.name || '';
      document.getElementById('checkoutAddress').value = a.line1 || '';
      document.getElementById('checkoutCity').value = a.city || '';
      document.getElementById('checkoutState').value = a.state || '';
      document.getElementById('checkoutZip').value = a.zip || '';
      document.getElementById('checkoutPhone').value = a.phone || '';
      const countrySel = document.getElementById('checkoutCountry');
      if (countrySel && a.country) {
        const opts = Array.from(countrySel.options);
        const map = { US: 'United States', GB: 'United Kingdom', CA: 'Canada', AU: 'Australia', DE: 'Germany', FR: 'France' };
        const label = map[a.country] || a.country;
        const found = opts.find(o => o.value === a.country || o.text === label);
        if (found) countrySel.value = found.value;
      }
    });
}

async function applyCheckoutCoupon() {
  const input = document.getElementById('checkoutCouponInput');
  const msgEl = document.getElementById('checkoutCouponMessage');
  if (!input) return;
  const code = input.value.trim().toUpperCase();
  if (!code) {
    if (msgEl) { msgEl.textContent = 'Please enter a coupon code'; msgEl.className = 'coupon-message error'; }
    return;
  }
  const { subtotal } = getCartTotals();
  const user = JSON.parse(localStorage.getItem('auraeUser') || 'null');
  const email = (user && user.email) ? user.email : (document.getElementById('checkoutEmail')?.value?.trim() || '');
  try {
    const resp = await fetch(`/api/validate-coupon?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}&subtotal=${subtotal}`);
    const data = await resp.json();
    if (!data.ok) {
      if (msgEl) { msgEl.textContent = data.message || 'Invalid coupon code'; msgEl.className = 'coupon-message error'; }
      return;
    }
    cartCoupon = { code: data.code, applied: true };
    saveCartCoupon();
    renderCheckout();
  } catch (e) {
    if (msgEl) { msgEl.textContent = 'Could not verify coupon. Please try again.'; msgEl.className = 'coupon-message error'; }
  }
}

function selectPayment(method, el) {
  // PayPal only - no action needed
}

function showPaymentStatus(type, message) {
  const banner = document.getElementById('paymentStatusBanner');
  if (!banner) return;
  const colors = {
    error: { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    warning: { bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
    info: { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  };
  const c = colors[type] || colors.info;
  banner.style.cssText = `display:block;padding:14px 18px;border-radius:8px;font-size:13px;margin-bottom:20px;background:${c.bg};color:${c.text};border:1px solid ${c.border};`;
  banner.innerHTML = message;
}

function validateCheckoutForm() {
  const email = document.getElementById('checkoutEmail')?.value?.trim();
  const name = document.getElementById('checkoutName')?.value?.trim();
  const address = document.getElementById('checkoutAddress')?.value?.trim();
  const city = document.getElementById('checkoutCity')?.value?.trim();
  const zip = document.getElementById('checkoutZip')?.value?.trim();

  if (!email) { showPaymentStatus('error', '⚠️ Please enter your email address'); return false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showPaymentStatus('error', '⚠️ Please enter a valid email address'); return false; }
  if (!name) { showPaymentStatus('error', '⚠️ Please enter your full name'); return false; }
  if (!address) { showPaymentStatus('error', '⚠️ Please enter your shipping address'); return false; }
  if (!city) { showPaymentStatus('error', '⚠️ Please enter your city'); return false; }
  if (!zip) { showPaymentStatus('error', '⚠️ Please enter your ZIP/postal code'); return false; }
  return true;
}

function getCheckoutCustomerData() {
  return {
    email: document.getElementById('checkoutEmail')?.value?.trim() || '',
    name: document.getElementById('checkoutName')?.value?.trim() || '',
    phone: document.getElementById('checkoutPhone')?.value?.trim() || '',
    address: document.getElementById('checkoutAddress')?.value?.trim() || '',
    city: document.getElementById('checkoutCity')?.value?.trim() || '',
    state: document.getElementById('checkoutState')?.value?.trim() || '',
    zip: document.getElementById('checkoutZip')?.value?.trim() || '',
    country: document.getElementById('checkoutCountry')?.value || 'United States',
  };
}

async function processOrder() {
  // Validate form
  if (!validateCheckoutForm()) {
    document.getElementById('paymentStatusBanner')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const btn = document.getElementById('placeOrderBtn');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = 'Preparing your order...';
  showPaymentStatus('info', '🔄 Connecting to secure payment gateway...');

  const customer = getCheckoutCustomerData();
  const items = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty,
    image: item.image,
    tagline: item.tagline,
    variant: item.variant || '',
  }));
  const coupon = cartCoupon.applied ? cartCoupon.code : '';

  const auth = {};
  const u = JSON.parse(localStorage.getItem('auraeUser') || 'null');
  if (u) { auth.userId = u.id; auth.userEmail = u.email; }

  try {
    const config = await loadPaymentConfig();
    await processPayPalPayment(items, customer, btn, coupon, auth);
  } catch (error) {
    console.error('Payment error:', error);
    btn.disabled = false;
    btn.innerHTML = originalText;
    showPaymentStatus('error', `❌ Payment failed: ${error.message}. Please try again or contact support.`);
  }
}

// ===== Stripe Payment Flow =====
async function processStripePayment(items, customer, btn, coupon = '', auth = {}) {
  // Check if Stripe is configured
  const config = await loadPaymentConfig();
  if (!config.stripePublishableKey) {
    showPaymentStatus('warning', '⚠️ <strong>Stripe is not configured yet.</strong><br>Please set your Stripe API keys in <code>server/.env</code> to enable real payments. See <code>支付接入配置指南.md</code> for setup instructions.<br><br>For now, simulating payment for demo purposes...');
    // Demo mode fallback
    btn.innerHTML = 'Processing (demo mode)...';
    setTimeout(() => {
      const orderNum = 'CM-DEMO-' + Date.now().toString().slice(-6);
      saveOrder(orderNum, items, customer, 'stripe-demo');
      markCouponUsed();
      cart = [];
      saveCart();
      renderCart();
      document.getElementById('successOrderNum').textContent = orderNum;
      document.getElementById('successModal').classList.add('open');
      btn.disabled = false;
      btn.innerHTML = 'Place Order';
    }, 1500);
    return;
  }

  btn.innerHTML = 'Redirecting to Stripe...';
  showPaymentStatus('info', '🔐 Creating secure Stripe checkout session...');

  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, customer, coupon, userId: auth.userId || null, userEmail: auth.userEmail || null }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create checkout session');
  }

  // Redirect to Stripe Checkout
  showPaymentStatus('info', '✅ Redirecting to Stripe secure payment page...');
  window.location.href = data.url;
}

// ===== PayPal Payment Flow =====
async function processPayPalPayment(items, customer, btn, coupon = '', auth = {}) {
  const config = await loadPaymentConfig();

  if (!config.paypalClientId) {
    showPaymentStatus('warning', '⚠️ <strong>PayPal is not configured yet.</strong><br>Please set your PayPal credentials in <code>server/.env</code> to enable PayPal payments. See <code>支付接入配置指南.md</code> for setup instructions.<br><br>For now, simulating payment for demo purposes...');
    btn.innerHTML = 'Processing (demo mode)...';
    setTimeout(() => {
      const orderNum = 'CM-DEMO-' + Date.now().toString().slice(-6);
      saveOrder(orderNum, items, customer, 'paypal-demo');
      markCouponUsed();
      cart = [];
      saveCart();
      renderCart();
      document.getElementById('successOrderNum').textContent = orderNum;
      document.getElementById('successModal').classList.add('open');
      btn.disabled = false;
      btn.innerHTML = 'Place Order';
    }, 1500);
    return;
  }

  btn.innerHTML = 'Creating PayPal order...';
  showPaymentStatus('info', '🅿️ Creating PayPal order...');

  // Create PayPal order on backend
  const createResp = await fetch('/api/create-paypal-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, customer, coupon, userId: auth.userId || null, userEmail: auth.userEmail || null }),
  });

  const createData = await createResp.json();

  if (!createResp.ok) {
    throw new Error(createData.error || 'Failed to create PayPal order');
  }

  // Load PayPal SDK if not already loaded
  if (!paypalLoaded) {
    await loadPayPalSDK(config.paypalClientId, config.paypalMode || 'sandbox');
    paypalLoaded = true;
  }

  btn.innerHTML = 'Opening PayPal...';
  showPaymentStatus('info', '🅿️ Please complete your payment in the PayPal window...');

  // Render PayPal buttons
  const container = document.getElementById('paypalButtonContainer');
  container.innerHTML = '<div id="paypal-btn"></div>';

  window.paypal.Buttons({
    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' },
    
    // Order is already created on backend, just approve it
    createOrder: function() {
      return Promise.resolve(createData.paypalOrderId);
    },

    onApprove: async function(data) {
      btn.innerHTML = 'Capturing payment...';
      showPaymentStatus('info', '✅ PayPal approved! Capturing payment...');

      const captureResp = await fetch('/api/capture-paypal-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paypalOrderId: data.orderID,
          orderId: createData.orderId,
        }),
      });

      const captureData = await captureResp.json();

      if (!captureResp.ok) {
        throw new Error(captureData.error || 'Failed to capture PayPal payment');
      }

      // Save order, clear cart, mark coupon used and redirect to success page
      saveOrder(createData.orderId, items, customer, 'paypal');
      markCouponUsed();
      cart = [];
      saveCart();
      renderCart();
      window.location.href = `index.html?order_success=1&order_id=${createData.orderId}`;
    },

    onError: function(err) {
      console.error('PayPal error:', err);
      btn.disabled = false;
      btn.innerHTML = 'Place Order';
      showPaymentStatus('error', '❌ PayPal payment was cancelled or failed. Please try again.');
    },

    onCancel: function() {
      btn.disabled = false;
      btn.innerHTML = 'Place Order';
      showPaymentStatus('warning', 'ℹ️ PayPal payment was cancelled. Your cart is saved — try again when ready.');
    },
  }).render('#paypal-btn');
}

function loadPayPalSDK(clientId, mode) {
  return new Promise((resolve, reject) => {
    if (window.paypal) { resolve(); return; }
    const script = document.createElement('script');
    const baseUrl = mode === 'live'
      ? 'https://www.paypal.com/sdk/js'
      : 'https://www.sandbox.paypal.com/sdk/js';
    script.src = `${baseUrl}?client-id=${clientId}&currency=USD&intent=capture`;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.head.appendChild(script);
  });
}

function closeSuccessModal() {
  document.getElementById('successModal').classList.remove('open');
  navigate('home');
}

// ===== Size Guide =====
const BRACELET_SIZE_TABLE = [
  { bead: '4mm', count: '~38 beads', wrist: '14-15cm' },
  { bead: '6mm', count: '~29 beads', wrist: '14-15cm' },
  { bead: '8mm', count: '~23 beads', wrist: '15-16cm' },
  { bead: '10mm', count: '~19 beads', wrist: '15-16cm' },
  { bead: '12mm', count: '~17 beads', wrist: '16-17cm' },
  { bead: '14mm', count: '~15 beads', wrist: '16-17cm' },
  { bead: '16mm', count: '~14 beads', wrist: '17-18cm' },
];

const NECKLACE_SIZE_TABLE = [
  { name: 'Choker', length: '14-16" / 35-40cm', fit: 'Sits at base of neck' },
  { name: 'Princess', length: '17-19" / 43-48cm', fit: 'Sits on collarbone (most popular)' },
  { name: 'Matinee', length: '20-24" / 51-61cm', fit: 'Falls just above the bust' },
  { name: 'Opera', length: '28-34" / 71-86cm', fit: 'Falls below the bust' },
];

function renderBraceletGuide() {
  return `
    <div class="size-guide-section">
      <h4>Bracelet Bead Size & Wrist Fit</h4>
      <p class="size-guide-note">All measurements are approximate. Choose a larger bead for a bolder look, or a smaller bead for everyday comfort.</p>
      <div class="size-guide-table-wrap">
        <table class="size-guide-table">
          <thead>
            <tr>
              <th>Bead Diameter</th>
              <th>Approx. Bead Count</th>
              <th>Wrist Fit</th>
            </tr>
          </thead>
          <tbody>
            ${BRACELET_SIZE_TABLE.map(r => `<tr><td>${r.bead}</td><td>${r.count}</td><td>${r.wrist}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="size-guide-tip">
        <strong>How to measure your wrist:</strong>
        <ol>
          <li>Wrap a soft measuring tape (or a strip of paper) around your wrist just below the wrist bone.</li>
          <li>Mark where the end meets the rest of the strip.</li>
          <li>Lay it flat against a ruler to get your wrist circumference.</li>
          <li>Add 0.5-1cm for a comfortable fit.</li>
        </ol>
      </div>
    </div>
  `;
}

function renderNecklaceGuide() {
  return `
    <div class="size-guide-section">
      <h4>Necklace Length Guide</h4>
      <p class="size-guide-note">Not sure which length to choose? Use this chart to find where each length sits on your body.</p>
      <div class="size-guide-table-wrap">
        <table class="size-guide-table">
          <thead>
            <tr>
              <th>Style</th>
              <th>Length</th>
              <th>Where It Sits</th>
            </tr>
          </thead>
          <tbody>
            ${NECKLACE_SIZE_TABLE.map(r => `<tr><td>${r.name}</td><td>${r.length}</td><td>${r.fit}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openSizeGuide(category) {
  const modal = document.getElementById('sizeGuideModal');
  const overlay = document.getElementById('sizeGuideOverlay');
  const body = document.getElementById('sizeGuideBody');
  if (!modal || !overlay || !body) return;

  const content = category === 'bracelet'
    ? renderBraceletGuide()
    : category === 'necklace'
    ? renderNecklaceGuide()
    : renderBraceletGuide() + renderNecklaceGuide();

  body.innerHTML = content;
  modal.classList.add('open');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSizeGuide() {
  const modal = document.getElementById('sizeGuideModal');
  const overlay = document.getElementById('sizeGuideOverlay');
  if (modal) modal.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ===== Reviews =====
let currentReviewProductId = null;

function getStarInputHTML(name) {
  return `
    <div class="star-rating-input" data-name="${name}">
      ${[5, 4, 3, 2, 1].map(i => `
        <input type="radio" name="${name}" id="${name}-${i}" value="${i}">
        <label for="${name}-${i}" title="${i} star${i > 1 ? 's' : ''}">★</label>
      `).join('')}
    </div>
  `;
}

function renderReviewStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

async function loadProductReviews(productId) {
  currentReviewProductId = productId;
  const container = document.getElementById('reviewsContent');
  if (!container) return;

  try {
    const res = await fetch(`/api/reviews/${productId}`);
    const data = await res.json();
    renderProductReviews(data.reviews, data.averageRating, data.count);
  } catch (err) {
    console.error('[Reviews] Failed to load reviews:', err);
    container.innerHTML = '<p class="reviews-empty">Reviews are currently unavailable. Please try again later.</p>';
  }
}

function scrollToReviewForm() {
  const formWrap = document.getElementById('reviewForm') || document.getElementById('productReviews');
  if (formWrap) {
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const firstInput = formWrap.querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    }, 400);
  }
}

function renderProductReviews(reviews, average, count) {
  const container = document.getElementById('reviewsContent');
  if (!container) return;

  const summary = count > 0
    ? `
      <div class="reviews-summary">
        <div class="reviews-average">${average.toFixed(1)}</div>
        <div class="reviews-meta">
          <div class="reviews-stars">${renderReviewStars(average)}</div>
          <div class="reviews-count">Based on ${count} review${count === 1 ? '' : 's'}</div>
        </div>
      </div>
    `
    : `<div class="reviews-empty-cta"><p>No reviews yet — be the first to share your experience!</p><button class="btn btn-dark btn-sm" onclick="scrollToReviewForm()">⭐ Write the First Review</button></div>`;

  const list = reviews.length
    ? `
      <div class="reviews-list">
        ${reviews.map(r => `
          <div class="review-card">
            <div class="review-header">
              <div class="review-author">
                <div class="review-avatar">${r.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div class="review-name">${escapeHtml(r.name)}</div>
                  <div class="review-stars">${renderReviewStars(r.rating)}</div>
                </div>
              </div>
              <div class="review-date">${formatDate(r.createdAt)}</div>
            </div>
            <div class="review-title">${escapeHtml(r.title)}</div>
            <div class="review-body">${escapeHtml(r.comment)}</div>
            ${r.images && r.images.length ? `<div class="review-images">${r.images.map(img => `<a href="${escapeHtml(img)}" target="_blank" rel="noopener"><img src="${escapeHtml(img)}" alt="Customer photo" loading="lazy" decoding="async"></a>`).join('')}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `
    : '';

  container.innerHTML = `
    ${summary}
    ${list}
    <div class="review-form-wrap">
      <h4>Write a Review</h4>
      <form id="reviewForm" onsubmit="submitReview(event)">
        <div class="form-row">
          <div class="form-group">
            <label for="reviewName">Name</label>
            <input type="text" id="reviewName" required placeholder="Your name">
          </div>
          <div class="form-group">
            <label for="reviewEmail">Email</label>
            <input type="email" id="reviewEmail" required placeholder="your@email.com">
          </div>
        </div>
        <div class="form-group">
          <label>Rating</label>
          ${getStarInputHTML('reviewRating')}
        </div>
        <div class="form-group">
          <label for="reviewTitle">Review Title</label>
          <input type="text" id="reviewTitle" required placeholder="Summarize your experience">
        </div>
        <div class="form-group">
          <label for="reviewBody">Review</label>
          <textarea id="reviewBody" rows="4" required placeholder="What did you like? How did the crystal feel?"></textarea>
        </div>
        <div class="form-group">
          <label for="reviewImages">Photos (optional, up to 5)</label>
          <input type="file" id="reviewImages" accept="image/*" multiple>
        </div>
        <button type="submit" class="btn btn-dark btn-full" id="reviewSubmitBtn">Submit Review</button>
      </form>
    </div>
  `;
}

async function submitReview(e) {
  e.preventDefault();
  if (!currentReviewProductId) return;

  const btn = document.getElementById('reviewSubmitBtn');
  const name = document.getElementById('reviewName').value.trim();
  const email = document.getElementById('reviewEmail').value.trim();
  const title = document.getElementById('reviewTitle').value.trim();
  const body = document.getElementById('reviewBody').value.trim();
  const ratingEl = document.querySelector('input[name="reviewRating"]:checked');

  if (!name || !email || !title || !body) {
    showToast('Please fill in all fields.');
    return;
  }
  if (!ratingEl) {
    showToast('Please select a star rating.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const fd = new FormData();
    fd.append('productId', currentReviewProductId);
    fd.append('name', name);
    fd.append('email', email);
    fd.append('title', title);
    fd.append('comment', body);
    fd.append('rating', ratingEl.value);
    const u = JSON.parse(localStorage.getItem('auraeUser') || 'null');
    if (u) { fd.append('userId', u.id); fd.append('userEmail', u.email); }
    const fileInput = document.getElementById('reviewImages');
    if (fileInput && fileInput.files) {
      for (const f of fileInput.files) fd.append('images', f);
    }
    const headers = {};
    const token = getAuthToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch('/api/reviews', { method: 'POST', headers, body: fd });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Thank you! Your review has been submitted and is awaiting approval.');
      document.getElementById('reviewForm').reset();
      loadProductReviews(currentReviewProductId);
    } else {
      showToast(data.error || 'Failed to submit review. Please try again.');
    }
  } catch (err) {
    console.error('[Reviews] Submit error:', err);
    showToast('Network error. Please try again later.');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Submit Review';
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ===== Cookie Consent =====
function initCookieConsent() {
  const banner = document.getElementById('cookieConsent');
  if (!banner) return;
  const consent = localStorage.getItem('auraeCookieConsent');
  if (!consent) {
    banner.style.display = 'block';
  }
}

function acceptCookies() {
  localStorage.setItem('auraeCookieConsent', 'accepted');
  const banner = document.getElementById('cookieConsent');
  if (banner) banner.style.display = 'none';
}

function declineCookies() {
  localStorage.setItem('auraeCookieConsent', 'declined');
  const banner = document.getElementById('cookieConsent');
  if (banner) banner.style.display = 'none';
  showToast('You can update your choice anytime in Privacy Policy.');
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ===== Search =====
function openSearch() {
  document.getElementById('searchModal').classList.add('open');
  document.getElementById('searchOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('searchInput').focus(), 100);
}

function closeSearch() {
  document.getElementById('searchModal').classList.remove('open');
  document.getElementById('searchOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderSearchResults(query) {
  const container = document.getElementById('searchResults');
  const q = query.trim().toLowerCase();
  if (!q) {
    container.innerHTML = '<div class="search-hint">Type to search crystals, jewelry, or intentions...</div>';
    return;
  }
  pintrkTrack('search', { search_query: q });
  const results = PRODUCTS.filter(p => {
    const text = [
      p.name, p.nameCN, p.tagline, p.crystal, p.crystalCN,
      p.category, p.intention, p.description
    ].join(' ').toLowerCase();
    return text.includes(q);
  });
  if (results.length === 0) {
    container.innerHTML = `<div class="search-empty"><div class="icon">🔍</div><p>No products found for "${escapeHtml(query)}"</p><p style="font-size:13px;">Try searching for "amethyst", "bracelet", "protection", or "love".</p></div>`;
    return;
  }
  container.innerHTML = '<div class="product-grid">' + results.map(p => productCardHTML(p, { showHeart: true })).join('') + '</div>';
  attachProductCardHandlers();
}

// ===== Contact =====
async function submitContact(e) {
  e.preventDefault();
  const nameEl = document.getElementById('contactName');
  const emailEl = document.getElementById('contactEmail');
  const subjectEl = document.getElementById('contactSubject');
  const messageEl = document.getElementById('contactMessage');
  const btn = document.getElementById('contactSubmitBtn');
  if (!nameEl || !emailEl || !subjectEl || !messageEl) return;

  const name = nameEl.value.trim();
  const email = emailEl.value.trim();
  const subject = subjectEl.value.trim();
  const message = messageEl.value.trim();

  if (!name || !email || !subject || !message) {
    showToast('Please fill in all fields');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Please enter a valid email address');
    return;
  }

  const payload = {
    name, email, subject, message,
    createdAt: new Date().toISOString(),
    source: !!document.getElementById('homeView') ? 'store' : 'standalone'
  };

  btn.disabled = true;
  btn.textContent = 'Sending…';

  let savedRemotely = false;
  try {
    const resp = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (resp.ok) savedRemotely = true;
  } catch (err) {
    // Server unreachable (e.g. opened as static file) — fall back to local storage
  }

  if (!savedRemotely) {
    const msgs = JSON.parse(localStorage.getItem('auraeMessages') || '[]');
    msgs.push(Object.assign({ id: 'LOCAL' + Date.now() }, payload));
    localStorage.setItem('auraeMessages', JSON.stringify(msgs));
  }

  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (form) form.style.display = 'none';
  if (success) success.style.display = 'block';
  if (btn) { btn.disabled = false; btn.textContent = 'Send Message'; }
}

function resetContactForm() {
  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');
  if (form) {
    form.reset();
    form.style.display = 'block';
  }
  if (success) success.style.display = 'none';
}

// ===== View my messages (customer) =====
async function viewMyMessages() {
  const emailEl = document.getElementById('myMsgEmail');
  const listEl = document.getElementById('myMessagesList');
  if (!emailEl || !listEl) return;
  const email = emailEl.value.trim();
  if (!email) {
    listEl.innerHTML = '<p class="my-messages-empty">Please enter your email.</p>';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    listEl.innerHTML = '<p class="my-messages-empty">Please enter a valid email address.</p>';
    return;
  }
  listEl.innerHTML = '<p class="my-messages-empty">Loading…</p>';
  try {
    const resp = await fetch('/api/messages?email=' + encodeURIComponent(email));
    const data = await resp.json();
    if (!resp.ok) {
      listEl.innerHTML = '<p class="my-messages-empty">' + (data.error || 'Could not load messages.') + '</p>';
      return;
    }
    const messages = data.messages || [];
    if (messages.length === 0) {
      listEl.innerHTML = '<p class="my-messages-empty">No messages found for this email yet.</p>';
      return;
    }
    listEl.innerHTML = messages.map(m => {
      const replies = (m.replies || []).map(r =>
        `<div class="my-msg-reply">
           <div class="my-msg-reply-meta">Aurae Team · ${new Date(r.createdAt).toLocaleString()}</div>
           <div class="my-msg-reply-body">${r.reply.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div>
         </div>`).join('');
      const statusLabel = m.status === 'replied' ? 'Replied' : (m.status === 'read' ? 'Read' : 'New');
      return `<div class="my-msg-card">
        <div class="my-msg-head">
          <span class="my-msg-subject">${m.subject.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span>
          <span class="my-msg-status status-${m.status}">${statusLabel}</span>
        </div>
        <div class="my-msg-date">${new Date(m.createdAt).toLocaleString()}</div>
        <div class="my-msg-text">${m.message.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div>
        ${replies}
      </div>`;
    }).join('');
  } catch (e) {
    listEl.innerHTML = '<p class="my-messages-empty">Connection error. Please try again.</p>';
  }
}

// ===== Account =====
let accountTab = 'login';
let accountSubTab = 'orders';

function openAccount() {
  document.getElementById('accountDrawer').classList.add('open');
  document.getElementById('accountOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderAccount();
}

function closeAccount() {
  document.getElementById('accountDrawer').classList.remove('open');
  document.getElementById('accountOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function getAuthToken() {
  return localStorage.getItem('auraeToken') || '';
}

function renderAccount() {
  const token = getAuthToken();
  const userStr = localStorage.getItem('auraeUser');
  const body = document.getElementById('accountBody');
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      renderAccountProfile(body, user);
      return;
    } catch (e) {}
  }
  renderAccountLogin(body);
}

function renderAccountLogin(body) {
  if (accountTab === 'forgot') {
    body.innerHTML = `
      <div class="account-tabs">
        <button class="account-tab" onclick="switchAccountTab('login')">Login</button>
        <button class="account-tab" onclick="switchAccountTab('register')">Register</button>
        <button class="account-tab active">Forgot</button>
      </div>
      <form onsubmit="event.preventDefault(); handleForgotPassword();">
        <p style="font-size:14px;color:var(--color-text-muted);margin-bottom:16px;">Enter your email and we'll send you a reset link.</p>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="forgotEmail" placeholder="your@email.com" required>
        </div>
        <button class="btn btn-dark btn-full" type="submit">Send Reset Link</button>
        <button type="button" class="btn btn-text btn-full" style="margin-top:8px;" onclick="switchAccountTab('login')">Back to login</button>
      </form>
    `;
    return;
  }
  body.innerHTML = `
    <div class="account-tabs">
      <button class="account-tab ${accountTab === 'login' ? 'active' : ''}" onclick="switchAccountTab('login')">Login</button>
      <button class="account-tab ${accountTab === 'register' ? 'active' : ''}" onclick="switchAccountTab('register')">Register</button>
    </div>
    ${accountTab === 'login' ? `
      <form onsubmit="event.preventDefault(); handleLogin();">
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="accountEmail" placeholder="your@email.com" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="accountPassword" placeholder="••••••••" required>
        </div>
        <button class="btn btn-dark btn-full" type="submit">Login</button>
        <div style="text-align:center;margin-top:12px;">
          <button type="button" class="btn btn-text" style="font-size:13px;" onclick="switchAccountTab('forgot')">Forgot password?</button>
        </div>
      </form>
    ` : `
      <form onsubmit="event.preventDefault(); handleRegister();">
        <div class="form-group">
          <label>Name</label>
          <input type="text" id="accountName" placeholder="Jane Doe" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" id="accountEmail" placeholder="your@email.com" required>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="accountPassword" placeholder="••••••••" required minlength="6">
        </div>
        <button class="btn btn-dark btn-full" type="submit">Create Account</button>
      </form>
    `}
  `;
}

async function renderAccountProfile(body, user) {
  body.innerHTML = `
    <div class="account-welcome">
      <div class="avatar">👤</div>
      <h4>${escapeHtml(user.name || user.email)}</h4>
      <p>${escapeHtml(user.email)}</p>
    </div>
    <div class="account-tabs" style="margin-bottom:20px;">
      <button class="account-tab ${accountSubTab === 'orders' ? 'active' : ''}" onclick="switchAccountSubTab('orders')">Orders</button>
      <button class="account-tab ${accountSubTab === 'wishlist' ? 'active' : ''}" onclick="switchAccountSubTab('wishlist')">Wishlist</button>
      <button class="account-tab ${accountSubTab === 'addresses' ? 'active' : ''}" onclick="switchAccountSubTab('addresses')">Addresses</button>
      <button class="account-tab ${accountSubTab === 'password' ? 'active' : ''}" onclick="switchAccountSubTab('password')">Password</button>
    </div>
    <div id="accountSubContent"></div>
    <button class="btn btn-outline btn-full account-logout" style="margin-top:20px;" onclick="handleLogout()">Log Out</button>
  `;
  const subBody = document.getElementById('accountSubContent');
  if (!subBody) return;
  if (accountSubTab === 'orders') await renderAccountOrders(subBody, user);
  else if (accountSubTab === 'wishlist') await renderAccountWishlist(subBody, user);
  else if (accountSubTab === 'addresses') renderAccountAddresses(subBody, user);
  else if (accountSubTab === 'password') renderAccountPassword(subBody);
}

function switchAccountSubTab(tab) {
  accountSubTab = tab;
  renderAccount();
}

function switchAccountTab(tab) {
  accountTab = tab;
  renderAccount();
}

async function renderAccountOrders(container, user) {
  const token = getAuthToken();
  container.innerHTML = '<div class="account-empty">Loading your orders…</div>';
  if (!token) { container.innerHTML = '<div class="account-empty">Please log in again.</div>'; return; }
  try {
    const resp = await fetch('/api/me/orders', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { container.innerHTML = '<div class="account-empty">Could not load your orders.</div>'; return; }
    const data = await resp.json();
    const orders = data.orders || [];
    if (!orders.length) {
      container.innerHTML = '<div class="account-empty">No orders yet. Your completed purchases will appear here.</div>';
      return;
    }
    container.innerHTML = orders.slice().reverse().map(o => {
      const total = Number(o.total ?? o.totals?.total) || 0;
      const date = o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '';
      const items = (o.items || []).map(i => `${i.name} × ${i.qty}`).join(', ');
      const status = o.status || 'pending_payment';
      const statusLabel = { pending_payment: 'Awaiting Payment', paid: 'Paid', shipped: 'Shipped', delivered: 'Delivered' }[status] || status;
      const statusClass = status === 'delivered' ? 'delivered' : (status === 'shipped' ? 'shipped' : (status === 'paid' ? 'paid' : 'pending'));
      const trackingHTML = (status === 'shipped' || status === 'delivered') && o.trackingNumber
        ? `<div class="account-order-tracking">🚚 ${escapeHtml(o.carrier || 'Standard Shipping')} · Tracking <strong>${escapeHtml(o.trackingNumber)}</strong></div>`
        : '';
      const canRefund = ['paid', 'shipped', 'delivered'].includes(status);
      return `<div class="account-order">
        <div class="account-order-header">
          <span class="account-order-id">${escapeHtml(o.orderId)}</span>
          <span class="account-order-status status-${statusClass}">${escapeHtml(statusLabel)}</span>
          <span class="account-order-date">${escapeHtml(date)}</span>
        </div>
        <div class="account-order-items">${escapeHtml(items)}</div>
        ${trackingHTML}
        <div class="account-order-footer">
          <span class="account-order-total">${formatPrice(total)}</span>
          <div style="display:flex;gap:12px;align-items:center;">
            ${canRefund ? `<button class="btn btn-text" style="font-size:13px;" onclick="openRefundModal('${escapeHtml(o.orderId)}')">Request Return</button>` : ''}
            <a href="track.html?orderId=${encodeURIComponent(o.orderId)}&email=${encodeURIComponent(user.email)}" class="account-order-track">Track</a>
          </div>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="account-empty">Connection error loading orders.</div>';
  }
}

async function renderAccountWishlist(container, user) {
  const token = getAuthToken();
  container.innerHTML = '<div class="account-empty">Loading your wishlist…</div>';
  try {
    const resp = await fetch('/api/me/wishlist', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { container.innerHTML = '<div class="account-empty">Could not load wishlist.</div>'; return; }
    const data = await resp.json();
    const ids = data.wishlist || [];
    if (!ids.length) { container.innerHTML = '<div class="account-empty">Your wishlist is empty. Save crystals you love for later.</div>'; return; }
    const items = ids.map(id => PRODUCTS.find(p => p.id === id)).filter(Boolean);
    if (!items.length) { container.innerHTML = '<div class="account-empty">Some saved items are no longer available.</div>'; return; }
    container.innerHTML = `<div class="wishlist-grid">${items.map(p => productCardHTML(p, { showHeart: true })).join('')}</div>`;
  } catch (e) {
    container.innerHTML = '<div class="account-empty">Connection error.</div>';
  }
}

function renderAccountAddresses(container, user) {
  container.innerHTML = `
    <div class="account-section">
      <h4 style="margin-bottom:12px;">Saved Addresses</h4>
      <div id="addressList"><div class="account-empty">Loading…</div></div>
      <form id="addAddressForm" style="margin-top:20px;border-top:1px solid var(--color-border);padding-top:20px;" onsubmit="event.preventDefault(); handleAddAddress();">
        <h5 style="margin-bottom:12px;">Add Address</h5>
        <div class="form-group"><label>Label</label><input type="text" id="addrLabel" placeholder="Home / Office"></div>
        <div class="form-group"><label>Full Name</label><input type="text" id="addrName" placeholder="Jane Doe"></div>
        <div class="form-group"><label>Address Line 1 *</label><input type="text" id="addrLine1" required placeholder="123 Crystal St"></div>
        <div class="form-group"><label>Address Line 2</label><input type="text" id="addrLine2" placeholder="Apt 4"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group"><label>City *</label><input type="text" id="addrCity" required></div>
          <div class="form-group"><label>ZIP *</label><input type="text" id="addrZip" required></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group"><label>State</label><input type="text" id="addrState" placeholder="CA"></div>
          <div class="form-group"><label>Country</label><input type="text" id="addrCountry" value="US"></div>
        </div>
        <div class="form-group"><label>Phone</label><input type="tel" id="addrPhone" placeholder="+1 555 123 4567"></div>
        <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:16px;"><input type="checkbox" id="addrDefault"> Set as default</label>
        <button class="btn btn-dark btn-full" type="submit">Save Address</button>
      </form>
    </div>
  `;
  loadAddressList();
}

async function loadAddressList() {
  const list = document.getElementById('addressList');
  if (!list) return;
  const token = getAuthToken();
  try {
    const resp = await fetch('/api/me/addresses', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) { list.innerHTML = '<div class="account-empty">Could not load addresses.</div>'; return; }
    const data = await resp.json();
    const addresses = data.addresses || [];
    if (!addresses.length) { list.innerHTML = '<div class="account-empty">No saved addresses yet.</div>'; return; }
    list.innerHTML = addresses.map(a => `
      <div class="address-card" style="border:1px solid var(--color-border);border-radius:12px;padding:14px;margin-bottom:12px;position:relative;">
        <div style="font-weight:700;margin-bottom:4px;">${escapeHtml(a.label || 'Address')} ${a.isDefault ? '<span style="font-size:12px;background:var(--color-accent);color:#fff;padding:2px 8px;border-radius:20px;">Default</span>' : ''}</div>
        <div style="font-size:14px;color:var(--color-text-muted);line-height:1.5;">
          ${a.name ? escapeHtml(a.name) + '<br>' : ''}
          ${escapeHtml(a.line1)}${a.line2 ? '<br>' + escapeHtml(a.line2) : ''}<br>
          ${escapeHtml(a.city)}, ${escapeHtml(a.state || '')} ${escapeHtml(a.zip)} ${escapeHtml(a.country || '')}<br>
          ${a.phone ? escapeHtml(a.phone) : ''}
        </div>
        <button class="btn btn-text" style="position:absolute;top:12px;right:12px;font-size:13px;" onclick="deleteAddress('${escapeHtml(a.id)}')">Remove</button>
      </div>
    `).join('');
  } catch (e) { list.innerHTML = '<div class="account-empty">Connection error.</div>'; }
}

function renderAccountPassword(container) {
  container.innerHTML = `
    <div class="account-section">
      <h4 style="margin-bottom:12px;">Change Password</h4>
      <form onsubmit="event.preventDefault(); handleChangePassword();">
        <div class="form-group"><label>Current Password</label><input type="password" id="currentPassword" required></div>
        <div class="form-group"><label>New Password</label><input type="password" id="newPassword" required minlength="6"></div>
        <div class="form-group"><label>Confirm New Password</label><input type="password" id="confirmPassword" required minlength="6"></div>
        <button class="btn btn-dark btn-full" type="submit">Update Password</button>
      </form>
    </div>
  `;
}

async function handleLogin() {
  const email = document.getElementById('accountEmail').value.trim().toLowerCase();
  const password = document.getElementById('accountPassword').value;
  if (!email || !password) { showToast('Please enter email and password'); return; }
  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await resp.json();
    if (!resp.ok) { showToast(data.error || 'Login failed'); return; }
    localStorage.setItem('auraeToken', data.token);
    localStorage.setItem('auraeUser', JSON.stringify(data.user));
    await loadServerCart();
    renderAccount();
    showToast('Welcome back, ' + (data.user.name || data.user.email));
  } catch (e) {
    showToast('Network error. Please try again.');
  }
}

async function handleRegister() {
  const name = document.getElementById('accountName').value.trim();
  const email = document.getElementById('accountEmail').value.trim().toLowerCase();
  const password = document.getElementById('accountPassword').value;
  if (!name || !email || !password) { showToast('Please fill in all fields'); return; }
  try {
    const resp = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await resp.json();
    if (!resp.ok) { showToast(data.error || 'Registration failed'); return; }
    localStorage.setItem('auraeToken', data.token);
    localStorage.setItem('auraeUser', JSON.stringify(data.user));
    await loadServerCart();
    renderAccount();
    showToast('Account created. Welcome to Aurae!');
    pintrkTrack('signup', {});
  } catch (e) {
    showToast('Network error. Please try again.');
  }
}

async function handleLogout() {
  const token = getAuthToken();
  if (token) {
    try { await fetch('/api/me/cart', { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } }); } catch (e) {}
  }
  localStorage.removeItem('auraeToken');
  localStorage.removeItem('auraeUser');
  cart = [];
  localStorage.removeItem('crystalCart');
  localStorage.removeItem('auraeCartCoupon');
  accountTab = 'login';
  accountSubTab = 'orders';
  renderAccount();
  renderCart();
  updateCartCount();
  showToast('Logged out successfully');
}

// ===== Order History =====
function saveOrder(orderId, items, customer, provider) {
  const totals = getCartTotals(items);
  const order = {
    id: orderId,
    date: new Date().toISOString(),
    items: items.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
    customer,
    provider,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    discount: totals.discount,
    tax: totals.tax,
    total: totals.total
  };
  const orders = JSON.parse(localStorage.getItem('auraeOrders') || '[]');
  orders.push(order);
  localStorage.setItem('auraeOrders', JSON.stringify(orders));
  // Pinterest purchase event
  pintrkTrack('purchase', {
    value: totals.total,
    order_quantity: items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
    currency: 'USD',
    order_id: String(orderId),
    line_items: buildPinterestLineItems(items)
  });
}

// ===== Account action handlers =====
async function handleForgotPassword() {
  const email = document.getElementById('forgotEmail')?.value?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email'); return; }
  try {
    const resp = await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (resp.ok) { showToast('If this email is registered, a reset link has been sent.'); switchAccountTab('login'); }
    else { showToast('Failed to send reset link. Try again.'); }
  } catch (e) { showToast('Network error. Please try again.'); }
}

async function handleResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const password = document.getElementById('resetPassword')?.value;
  const confirm = document.getElementById('resetPasswordConfirm')?.value;
  if (!token) { showToast('Invalid reset link.'); return; }
  if (!password || password.length < 6) { showToast('Password must be at least 6 characters.'); return; }
  if (password !== confirm) { showToast('Passwords do not match.'); return; }
  try {
    const resp = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    if (resp.ok) { showToast('Password updated! Please log in.'); window.location.href = 'index.html'; }
    else { showToast('Reset link expired or invalid.'); }
  } catch (e) { showToast('Network error. Please try again.'); }
}

async function handleChangePassword() {
  const current = document.getElementById('currentPassword')?.value;
  const newPass = document.getElementById('newPassword')?.value;
  const confirm = document.getElementById('confirmPassword')?.value;
  if (!current || !newPass || newPass.length < 6) { showToast('Please fill all fields (min 6 chars).'); return; }
  if (newPass !== confirm) { showToast('New passwords do not match.'); return; }
  const token = getAuthToken();
  try {
    const resp = await fetch('/api/me/password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ currentPassword: current, newPassword: newPass }) });
    if (resp.ok) { showToast('Password updated successfully.'); document.getElementById('currentPassword').value = ''; document.getElementById('newPassword').value = ''; document.getElementById('confirmPassword').value = ''; }
    else { const data = await resp.json(); showToast(data.error || 'Failed to update password.'); }
  } catch (e) { showToast('Network error. Please try again.'); }
}

async function handleAddAddress() {
  const token = getAuthToken();
  const payload = {
    label: document.getElementById('addrLabel')?.value?.trim() || 'Home',
    name: document.getElementById('addrName')?.value?.trim(),
    line1: document.getElementById('addrLine1')?.value?.trim(),
    line2: document.getElementById('addrLine2')?.value?.trim(),
    city: document.getElementById('addrCity')?.value?.trim(),
    state: document.getElementById('addrState')?.value?.trim(),
    zip: document.getElementById('addrZip')?.value?.trim(),
    country: document.getElementById('addrCountry')?.value?.trim(),
    phone: document.getElementById('addrPhone')?.value?.trim(),
    isDefault: document.getElementById('addrDefault')?.checked || false,
  };
  if (!payload.line1 || !payload.city || !payload.zip) { showToast('Please fill required address fields.'); return; }
  try {
    const resp = await fetch('/api/me/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify(payload) });
    if (resp.ok) { showToast('Address saved.'); document.getElementById('addAddressForm').reset(); loadAddressList(); }
    else { showToast('Failed to save address.'); }
  } catch (e) { showToast('Network error. Please try again.'); }
}

async function deleteAddress(id) {
  if (!confirm('Remove this address?')) return;
  const token = getAuthToken();
  try {
    const resp = await fetch('/api/me/addresses/' + encodeURIComponent(id), { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } });
    if (resp.ok) { showToast('Address removed.'); loadAddressList(); }
    else { showToast('Failed to remove address.'); }
  } catch (e) { showToast('Network error. Please try again.'); }
}

function isWishlisted(productId) {
  const raw = localStorage.getItem('auraeWishlist') || '[]';
  try { return JSON.parse(raw).includes(productId); } catch (e) { return false; }
}

function setLocalWishlist(list) {
  localStorage.setItem('auraeWishlist', JSON.stringify(list));
}

async function toggleWishlist(productId) {
  const token = getAuthToken();
  const local = JSON.parse(localStorage.getItem('auraeWishlist') || '[]');
  const idx = local.indexOf(productId);
  if (idx >= 0) {
    local.splice(idx, 1);
    setLocalWishlist(local);
    if (token) {
      try { await fetch('/api/me/wishlist/' + encodeURIComponent(productId), { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } }); } catch (e) {}
    }
    showToast('Removed from wishlist');
  } else {
    local.push(productId);
    setLocalWishlist(local);
    if (token) {
      try { await fetch('/api/me/wishlist', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token }, body: JSON.stringify({ productId }) }); } catch (e) {}
    }
    showToast('Saved to wishlist ✨');
  }
  renderWishlistIcons();
  if (accountSubTab === 'wishlist') renderAccount();
}

async function loadServerWishlist() {
  const token = getAuthToken();
  if (!token) return;
  try {
    const resp = await fetch('/api/me/wishlist', { headers: { 'Authorization': 'Bearer ' + token } });
    if (!resp.ok) return;
    const data = await resp.json();
    const server = data.wishlist || [];
    const local = JSON.parse(localStorage.getItem('auraeWishlist') || '[]');
    const merged = Array.from(new Set([...local, ...server]));
    setLocalWishlist(merged);
    renderWishlistIcons();
  } catch (e) {}
}

function renderWishlistIcons() {
  document.querySelectorAll('[data-wishlist-id]').forEach(el => {
    const id = el.dataset.wishlistId;
    const liked = isWishlisted(id);
    el.innerHTML = liked ? '♥' : '♡';
    el.classList.toggle('wishlist-active', liked);
  });
}

function openRefundModal(orderId) {
  const reason = prompt('Please tell us why you would like to return items from order ' + orderId + ':');
  if (!reason || !reason.trim()) return;
  submitRefund(orderId, reason.trim());
}

async function submitRefund(orderId, reason) {
  const token = getAuthToken();
  try {
    const resp = await fetch('/api/refund-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ orderId, reason }),
    });
    if (resp.ok) { showToast('Return request submitted.'); }
    else { const data = await resp.json(); showToast(data.error || 'Failed to submit request.'); }
  } catch (e) { showToast('Network error. Please try again.'); }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
  // Load the latest product data (admin-managed images/stock) from the backend
  // before the first render, so the storefront reflects admin changes.
  await refreshProducts();
  // Sync logged-in user data across devices
  if (getAuthToken()) {
    await loadServerCart();
    await loadServerWishlist();
  }
  const isStorePage = !!document.getElementById('homeView');
  if (isStorePage) {
    renderHome();
  }
  renderCart();
  updateCartCount();
  renderWishlistIcons();
  initCookieConsent();

  // Handle returning from PayPal success redirect or external page redirects
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('order_success') === '1') {
    const successModal = document.getElementById('successModal');
    if (successModal) {
      document.getElementById('successOrderNum').textContent = urlParams.get('order_id') || '';
      successModal.classList.add('open');
      window.history.replaceState({}, '', window.location.pathname);
    }
  } else if (isStorePage && urlParams.has('product')) {
    const pid = urlParams.get('product');
    if (PRODUCTS.find(p => p.id === pid)) {
      renderView('product', pid);
      window.history.replaceState({}, '', window.location.pathname);
    }
  } else if (isStorePage && urlParams.has('blog')) {
    const bid = urlParams.get('blog');
    if (BLOG_POSTS.find(b => b.id === bid)) {
      renderView('blog', bid);
      window.history.replaceState({}, '', window.location.pathname);
    }
  } else if (isStorePage && (urlParams.has('shop') || urlParams.get('view') === 'shop')) {
    const shopParam = urlParams.get('shop') || (urlParams.get('category') ? 'category:' + urlParams.get('category') : 'all');
    renderView('shop', shopParam);
    window.history.replaceState({}, '', window.location.pathname);
  } else if (isStorePage && urlParams.get('view') === 'about') {
    renderView('about');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (isStorePage && urlParams.get('view') === 'contact') {
    renderView('contact');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (isStorePage && urlParams.get('view') === 'track') {
    const trackParam = urlParams.get('order') || '';
    renderView('track', trackParam);
    window.history.replaceState({}, '', window.location.pathname);
  } else if (isStorePage && urlParams.get('view') === 'checkout') {
    renderView('checkout');
    window.history.replaceState({}, '', window.location.pathname);
  }

  // SPA nav + search + account wiring (store shell only).
  if (isStorePage) {
    // SPA Back/Forward support: re-render the view described by the URL.
    window.addEventListener('popstate', handlePopState);
    document.getElementById('cartBtn').addEventListener('click', openCart);
    document.getElementById('cartClose').addEventListener('click', closeCart);
    document.getElementById('cartOverlay').addEventListener('click', closeCart);
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      const email = input?.value?.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Please enter a valid email address'); return; }
      try {
        const resp = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        if (resp.ok) {
          showToast('Thank you for subscribing! 🌿');
          input.value = '';
          pintrkTrack('lead', { lead_type: 'Newsletter' });
        }
        else { showToast('Subscription failed. Please try again.'); }
      } catch (err) { showToast('Network error. Please try again.'); }
    });
    document.getElementById('searchBtn').addEventListener('click', openSearch);
    document.getElementById('searchClose').addEventListener('click', closeSearch);
    document.getElementById('searchOverlay').addEventListener('click', closeSearch);
    document.getElementById('searchInput').addEventListener('input', (e) => renderSearchResults(e.target.value));
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeSearch();
    });

    document.getElementById('accountBtn').addEventListener('click', openAccount);
    document.getElementById('accountClose').addEventListener('click', closeAccount);
    document.getElementById('accountOverlay').addEventListener('click', closeAccount);

    renderSearchResults('');
  }
});
