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

function saveCart() {
  localStorage.setItem('crystalCart', JSON.stringify(cart));
  updateCartCount();
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

// ===== Navigation =====
function navigate(view, param) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  // If this page doesn't have the SPA views (e.g. standalone legal pages),
  // redirect to index.html with the right query parameters.
  const hasViews = !!document.getElementById('homeView');
  if (!hasViews) {
    if (view === 'home') window.location.href = 'index.html';
    else if (view === 'shop') window.location.href = 'index.html?shop=' + encodeURIComponent(param || 'all');
    else if (view === 'product') window.location.href = 'index.html?product=' + encodeURIComponent(param || '');
    else if (view === 'about') window.location.href = 'index.html?view=about';
    else if (view === 'contact') window.location.href = 'index.html?view=contact';
    else if (view === 'blog') window.location.href = 'index.html?blog=' + encodeURIComponent(param || '');
    return;
  }

  if (view === 'home') {
    document.getElementById('homeView').classList.add('active');
    currentView = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'shop') {
    document.getElementById('shopView').classList.add('active');
    currentView = 'shop';
    renderShop(param || 'all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'product') {
    document.getElementById('productView').classList.add('active');
    currentView = 'product';
    renderProductDetail(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'checkout') {
    if (cart.length === 0) {
      showToast('Your cart is empty');
      return;
    }
    document.getElementById('checkoutView').classList.add('active');
    currentView = 'checkout';
    renderCheckout();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'about') {
    document.getElementById('aboutView').classList.add('active');
    currentView = 'about';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'contact') {
    document.getElementById('contactView').classList.add('active');
    currentView = 'contact';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (view === 'blog') {
    document.getElementById('blogView').classList.add('active');
    currentView = 'blog';
    renderBlogDetail(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));
  if (view !== 'product' && view !== 'checkout') {
    const navMap = { home: 'navHome', shop: 'navShop', about: 'navAbout', contact: 'navContact' };
    if (navMap[view]) document.getElementById(navMap[view])?.classList.add('active');
  }
}

// ===== Render Home Page =====
function renderHome() {
  // Best sellers (badge === 'Best Seller')
  const bestSellers = PRODUCTS.filter(p => p.badge === 'Best Seller').slice(0, 4);
  document.getElementById('bestSellersGrid').innerHTML = bestSellers.map(p => productCardHTML(p)).join('');

  // Featured products
  const featured = [
    PRODUCTS.find(p => p.id === 'p001'),
    PRODUCTS.find(p => p.id === 'p005'),
    PRODUCTS.find(p => p.id === 'p010'),
    PRODUCTS.find(p => p.id === 'p013')
  ].filter(Boolean);
  document.getElementById('featuredGrid').innerHTML = featured.map(p => productCardHTML(p)).join('');

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
    <div class="blog-card" onclick="navigate('blog', '${b.id}')">
      <img src="${b.image}" alt="${b.title}">
      <div class="blog-meta">${b.category} • ${b.readTime}</div>
      <h4>${b.title}</h4>
      <p>${b.excerpt}</p>
    </div>
  `).join('');

  attachProductCardHandlers();
  // Initialize quiz
  initQuiz();
}

function productCardHTML(p) {
  const badge = p.badge ? `<div class="product-badge">${p.badge}</div>` : '';
  const saleBadge = p.compareAt ? `<div class="product-badge sale">Sale</div>` : '';
  const stock = getStockStatus(p.stock);
  const stockBadge = stock.cls !== 'in'
    ? `<div class="product-stock-badge ${stock.cls}">${stock.label}</div>`
    : '';
  const fromPrefix = (p.variantPrices && p.variants) ? 'From ' : '';
  const priceHTML = p.compareAt
    ? `<span class="product-price">${formatPrice(p.price)}<span class="compare-at">${formatPrice(p.compareAt)}</span></span>`
    : `<span class="product-price">${fromPrefix}${formatPrice(p.price)}</span>`;

  return `
    <div class="product-card" data-product-id="${p.id}">
      ${badge}${saleBadge}${stockBadge}
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-tagline">${p.tagline}</div>
        <div class="product-rating">
          <span class="stars">${getStars(p.rating)}</span>
          <span>(${p.reviews})</span>
        </div>
        ${priceHTML}
        <button class="product-quick-add" onclick="event.stopPropagation(); quickAddToCart('${p.id}')">Quick Add</button>
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
function renderShop(filter) {
  let products = [...PRODUCTS];
  let title = 'All Crystal Jewelry';
  let subtitle = 'Discover authentic crystal jewelry crafted with intention for every energy need';

  if (filter && filter.startsWith('category:')) {
    const catId = filter.split(':')[1];
    const cat = CATEGORIES.find(c => c.id === catId);
    products = products.filter(p => p.category === catId);
    title = cat.name;
    subtitle = cat.desc;
  } else if (filter && filter.startsWith('intention:')) {
    const intentId = filter.split(':')[1];
    const intent = INTENTIONS.find(i => i.id === intentId);
    products = products.filter(p => p.intention === intentId);
    title = `${intent.icon} ${intent.name}`;
    subtitle = intent.desc;
  }

  const filterBar = `
    <div class="shop-filters" style="display:flex;gap:12px;margin-bottom:32px;flex-wrap:wrap;justify-content:center;">
      <button class="btn btn-outline" style="padding:8px 20px;font-size:13px;" onclick="navigate('shop','all')">All</button>
      ${CATEGORIES.map(c => `<button class="btn btn-outline" style="padding:8px 20px;font-size:13px;" onclick="navigate('shop','category:${c.id}')">${c.name}</button>`).join('')}
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
      <div class="product-grid" id="shopProductGrid">
        ${products.map(p => productCardHTML(p)).join('')}
      </div>
      ${products.length === 0 ? '<p style="text-align:center;padding:60px;color:var(--color-text-muted);">No products found in this category.</p>' : ''}
    </div>
  `;

  attachProductCardHandlers();
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
      <a onclick="navigate('shop','category:${product.category}')">${CATEGORIES.find(c => c.id === product.category)?.name || 'Shop'}</a> / 
      <span>${product.name}</span>
    </div>
  `;

  const gallery = `
    <div class="product-gallery">
      <img src="${product.image}" alt="${product.name}" id="mainProductImage">
      ${product.images && product.images.length > 1 ? `
        <div class="product-gallery-thumbs">
          ${product.images.map((img, i) => `<img src="${img}" alt="${product.name} ${i+1}" class="${i === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${img}')">`).join('')}
        </div>
      ` : ''}
    </div>
  `;

  const variants = product.variants ? product.variants.map(v => `
    <div class="variant-selector">
      <label>${v.name}</label>
      <div class="variant-options">
        ${v.options.map((opt, i) => `<div class="variant-option ${i === 0 ? 'selected' : ''}" onclick="selectVariant(this, '${v.name}', ${i}, '${opt}')">${opt}</div>`).join('')}
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
        <span class="crystal-meta-value">${product.crystal || '—'}</span>
      </div>
      <div class="crystal-meta-item">
        <span class="crystal-meta-label">Chakra</span>
        <span class="crystal-meta-value">${product.chakra || '—'}</span>
      </div>
      <div class="crystal-meta-item">
        <span class="crystal-meta-label">Element</span>
        <span class="crystal-meta-value">${product.element || '—'}</span>
      </div>
      <div class="crystal-meta-item">
        <span class="crystal-meta-label">Ruling Planet</span>
        <span class="crystal-meta-value">${product.planet || '—'}</span>
      </div>
    </div>
  `;

  // Ritual box
  const ritualBox = product.ritual ? `
    <div class="crystal-ritual-box">
      <h4>🔮 Ritual & Activation</h4>
      <p>${product.ritual}</p>
    </div>
  ` : '';

  document.getElementById('productDetailContent').innerHTML = `
    ${breadcrumb}
    <div class="product-detail-grid">
      ${gallery}
      <div class="product-detail-info">
        <h1>${product.name}</h1>
        <p class="product-detail-tagline">${product.tagline}</p>
        <div class="product-detail-rating">
          <span class="stars" style="font-size:18px;">${getStars(product.rating)}</span>
          <span style="font-size:13px;color:var(--color-text-muted);">${product.rating} • ${product.reviews} reviews</span>
        </div>
        ${priceHTML}
        ${crystalMeta}
        <p class="product-detail-desc">${product.description}</p>
        ${ritualBox}
        <div class="product-properties">
          <h4>✦ Energy Properties</h4>
          <ul>
            ${product.properties.map(prop => `<li>${prop}</li>`).join('')}
          </ul>
        </div>
        ${variants}
        <div class="stock-status stock-${stockInfo.cls}" id="stockStatus">
          <span class="stock-dot"></span>${stockInfo.label}
        </div>
        ${variants ? `<div class="size-guide-row"><button type="button" class="size-guide-btn" onclick="openSizeGuide('${product.category}')">📏 Size Guide</button></div>` : ''}
        <div style="display:flex;gap:16px;align-items:center;margin:18px 0 8px;">
          <div class="qty-selector">
            <button onclick="changeQty(-1)">−</button>
            <input type="number" id="qtyInput" value="1" min="1" onchange="syncQty(this.value)">
            <button onclick="changeQty(1)">+</button>
          </div>
          <span id="stockCount" style="font-size:13px;color:var(--color-text-muted);">${product.stock} in stock</span>
        </div>
        <button id="addToCartBtn" class="btn btn-dark btn-lg btn-full" onclick="addToCartDetail()" style="margin-bottom:16px;${stockInfo.cls === 'out' ? 'opacity:.5;cursor:not-allowed;' : ''}" ${stockInfo.cls === 'out' ? 'disabled' : ''}>${stockInfo.cls === 'out' ? 'Sold Out' : 'Add to Cart • ' + formatPrice(initialPrice)}</button>
        <button class="btn btn-outline btn-full" onclick="buyNowDetail()">Buy It Now</button>
        <div style="margin-top:24px;padding:16px;background:var(--color-bg-alt);border-radius:var(--radius-md);font-size:13px;color:var(--color-text-muted);">
          <div style="margin-bottom:6px;">🚚 <strong>Free shipping</strong> on orders over $50</div>
          <div style="margin-bottom:6px;">↩️ <strong>30-day returns</strong> — no questions asked</div>
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
          ${related.map(p => productCardHTML(p)).join('')}
        </div>
      </div>
    ` : ''}
  `;

  attachProductCardHandlers();
  loadProductReviews(product.id);
  refreshProductStock(product.id);
}

// Pull the live (server-authoritative) stock for a product detail page.
function refreshProductStock(productId) {
  fetch(`/api/products/${encodeURIComponent(productId)}`)
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (!data) return;
      const stock = Number(data.stock);
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
          btn.textContent = 'Add to Cart • ' + formatPrice(currentProduct ? currentProduct.price : 0);
        }
      }
    })
    .catch(() => {});
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
      <div class="hero-bg" style="background: linear-gradient(135deg, rgba(74,93,62,0.78) 0%, rgba(201,169,110,0.35) 100%), url('${blog.image}') center/cover;"></div>
      <div class="hero-content">
        <div class="blog-meta" style="text-transform:uppercase;letter-spacing:2px;font-size:13px;margin-bottom:16px;color:#fff;opacity:0.95;">${blog.category} • ${blog.readTime}</div>
        <h1 style="max-width:860px;font-size:42px;">${blog.title}</h1>
      </div>
    </section>
    <div class="container blog-detail-container">
      <div class="breadcrumb" style="margin-bottom:28px;">
        <a onclick="navigate('home')">Home</a> / <a onclick="navigate('home'); setTimeout(() => { const el = document.getElementById('blogGrid'); if (el) el.scrollIntoView({behavior:'smooth', block:'start'}); }, 100);">Journal</a> / <span>${blog.title}</span>
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
            ${relatedProducts.map(p => productCardHTML(p)).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  attachProductCardHandlers();
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

function updateProductPriceDisplay() {
  const price = getSelectedVariantPrice();
  const priceEl = document.getElementById('productDetailPrice');
  if (priceEl) priceEl.textContent = formatPrice(price);
  const btn = document.getElementById('addToCartBtn');
  if (btn) btn.textContent = `Add to Cart • ${formatPrice(price)}`;
}

function selectVariant(el, name, index, value) {
  el.parentElement.querySelectorAll('.variant-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  selectedVariant[name] = { index, value };
  updateProductPriceDisplay();
}

function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById('qtyInput').value = qty;
}

function syncQty(val) {
  qty = Math.max(1, parseInt(val) || 1);
  document.getElementById('qtyInput').value = qty;
}

function addToCartDetail() {
  if (!currentProduct) return;
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
  const existing = cart.find(c => c.id === item.id && c.variant === item.variant);
  if (existing) {
    existing.qty += item.qty;
  } else {
    cart.push(item);
  }
  saveCart();
  renderCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function changeCartQty(index, delta) {
  cart[index].qty = Math.max(1, cart[index].qty + delta);
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
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-tagline">${item.tagline}</div>
        <div class="cart-item-bottom">
          <div class="cart-qty">
            <button onclick="changeCartQty(${i}, -1)">−</button>
            <span>${item.qty}</span>
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
      <img src="${p.image}" alt="${p.name}">
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
            <input type="email" id="checkoutEmail" placeholder="your@email.com" value="${user ? user.email : ''}" required>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="tel" id="checkoutPhone" placeholder="+1 (555) 000-0000">
          </div>
        </div>
        <div class="form-section">
          <h3>Shipping Address</h3>
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="checkoutName" placeholder="Jane Doe" value="${user ? user.name : ''}" required>
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
        <p style="text-align:center;font-size:12px;color:var(--color-text-muted);margin-top:12px;">
          🔒 Your payment is processed securely by PayPal. We never store your financial details.
        </p>
      </div>
      <div class="order-summary">
        <h3>Order Summary</h3>
        <div class="summary-items">
          ${cart.map(item => `
            <div class="summary-item">
              <img src="${item.image}" alt="${item.name}">
              <div class="summary-item-info">
                <div class="summary-item-name">${item.name}</div>
                <div class="summary-item-qty">Qty: ${item.qty}</div>
              </div>
              <div class="summary-item-price">${formatPrice(item.price * item.qty)}</div>
            </div>
          `).join('')}
        </div>
        <div class="summary-totals">
          <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
          ${discount > 0 ? `<div class="summary-row discount"><span>Discount (${cartCoupon.code})</span><span>-${formatPrice(discount)}</span></div>` : ''}
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
          <div class="coupon-applied">✓ <strong>${cartCoupon.code}</strong> applied — 10% off first order <a onclick="removeCoupon(); renderCheckout();">Remove</a></div>
        </div>
        `}
      </div>
    </div>
  `;
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
    : '<p class="reviews-empty">No reviews yet. Be the first to share your experience!</p>';

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
            ${r.images && r.images.length ? `<div class="review-images">${r.images.map(img => `<a href="${escapeHtml(img)}" target="_blank" rel="noopener"><img src="${escapeHtml(img)}" alt="Customer photo"></a>`).join('')}</div>` : ''}
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

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function renderSearchResults(query) {
  const container = document.getElementById('searchResults');
  const q = query.trim().toLowerCase();
  if (!q) {
    container.innerHTML = '<div class="search-hint">Type to search crystals, jewelry, or intentions...</div>';
    return;
  }
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
  container.innerHTML = '<div class="product-grid">' + results.map(p => productCardHTML(p)).join('') + '</div>';
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
  const energyResult = JSON.parse(localStorage.getItem('auraeEnergyResult') || 'null');
  const energyHTML = energyResult ? `
    <div class="account-section">
      <h4>Your Energy Profile</h4>
      <div class="account-energy-result">
        <div class="result-icon">${energyResult.icon || '✨'}</div>
        <h5>${energyResult.title}</h5>
        <p>${energyResult.desc}</p>
        <button class="btn btn-outline btn-full" onclick="navigate('home'); closeAccount(); document.getElementById('energyQuizSection').scrollIntoView({behavior:'smooth'});">Retake Quiz</button>
      </div>
    </div>
  ` : `
    <div class="account-section">
      <h4>Your Energy Profile</h4>
      <div class="account-empty">
        <div style="font-size:32px;margin-bottom:8px;">🔮</div>
        <p>Take the energy quiz to discover your crystal alignment.</p>
        <button class="btn btn-outline btn-full" style="margin-top:12px;" onclick="navigate('home'); closeAccount(); document.getElementById('energyQuizSection').scrollIntoView({behavior:'smooth'});">Start Quiz</button>
      </div>
    </div>
  `;
  body.innerHTML = `
    <div class="account-welcome">
      <div class="avatar">👤</div>
      <h4>${escapeHtml(user.name || user.email)}</h4>
      <p>${escapeHtml(user.email)}</p>
    </div>
    <div class="account-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <h4 style="margin:0;">Order History</h4>
        <a href="track.html" class="account-order-track">Track an order</a>
      </div>
      <div id="accountOrders"><div class="account-empty">Loading your orders…</div></div>
    </div>
    ${energyHTML}
    <button class="btn btn-outline btn-full account-logout" onclick="handleLogout()">Log Out</button>
  `;

  const container = document.getElementById('accountOrders');
  if (!container) return;
  const token = getAuthToken();
  if (!token) {
    container.innerHTML = '<div class="account-empty">Please log in again to view your orders.</div>';
    return;
  }
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
      return `<div class="account-order">
        <div class="account-order-header">
          <span class="account-order-id">${escapeHtml(o.orderId)}</span>
          <span class="account-order-date">${escapeHtml(date)}</span>
        </div>
        <div class="account-order-items">${escapeHtml(items)}</div>
        <div class="account-order-footer">
          <span class="account-order-total">${formatPrice(total)}</span>
          <a href="track.html?orderId=${encodeURIComponent(o.orderId)}&email=${encodeURIComponent(user.email)}" class="account-order-track">Track</a>
        </div>
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div class="account-empty">Connection error loading orders.</div>';
  }
}

function switchAccountTab(tab) {
  accountTab = tab;
  renderAccount();
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
    renderAccount();
    showToast('Account created. Welcome to Aurae!');
  } catch (e) {
    showToast('Network error. Please try again.');
  }
}

function handleLogout() {
  localStorage.removeItem('auraeToken');
  localStorage.removeItem('auraeUser');
  accountTab = 'login';
  renderAccount();
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
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
  // Load the latest product data (admin-managed images/stock) from the backend
  // before the first render, so the storefront reflects admin changes.
  await refreshProducts();
  const isStorePage = !!document.getElementById('homeView');
  if (isStorePage) {
    renderHome();
  }
  renderCart();
  updateCartCount();

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
      navigate('product', pid);
      window.history.replaceState({}, '', window.location.pathname);
    }
  } else if (isStorePage && urlParams.has('shop')) {
    navigate('shop', urlParams.get('shop'));
    window.history.replaceState({}, '', window.location.pathname);
  } else if (isStorePage && urlParams.get('view') === 'about') {
    navigate('about');
    window.history.replaceState({}, '', window.location.pathname);
  } else if (isStorePage && urlParams.get('view') === 'contact') {
    navigate('contact');
    window.history.replaceState({}, '', window.location.pathname);
  }
  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  document.getElementById('cartOverlay').addEventListener('click', closeCart);
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Thank you for subscribing! 🌿');
    e.target.reset();
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
});
