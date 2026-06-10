/* product-detail.js */

let product = null;
let selectedQty = 1;

document.addEventListener('DOMContentLoaded', () => {
  initNavAuth();
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = '/'; return; }
  loadProduct(id);
});

function initNavAuth() {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');
  const navAuth   = document.getElementById('nav-auth');
  const navUser   = document.getElementById('nav-user');
  const navLogout = document.getElementById('nav-logout');
  const navOrders = document.getElementById('nav-orders');

  if (token && user) {
    navAuth.style.display   = 'none';
    navUser.style.display   = 'flex';
    navOrders.style.display = 'block';
    navUser.textContent     = `👋 ${user.name.split(' ')[0]}`;
    navLogout.style.display = 'block';
    navLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.href = '/';
    });
  }
  updateCartBadge();
}

async function loadProduct(id) {
  try {
    const data = await apiFetch(`/products/${id}`);
    product = data;
    renderProduct(data);
    if (data.related && data.related.length > 0) renderRelated(data.related);
  } catch (err) {
    document.getElementById('product-detail-root').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <h3>Product not found</h3>
        <a href="/" class="btn btn-primary mt-3">← Back to Shop</a>
      </div>`;
  }
}

function renderProduct(p) {
  document.title = `${p.name} — ShopNova`;
  document.getElementById('breadcrumb-cat').textContent = p.category;
  document.getElementById('breadcrumb-name').textContent = p.name;

  const inStock = p.stock > 0;

  document.getElementById('product-detail-root').innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-img">
        <img id="product-main-img" src="${p.image_url}"
             alt="${p.name}"
             onerror="this.src='https://placehold.co/600x600/1a1a2e/6c63ff?text=${encodeURIComponent(p.name.split(' ')[0])}'" />
      </div>

      <div class="product-detail-info">
        <div>
          <span class="badge badge-purple">${p.category}</span>
        </div>
        <h1 style="font-size:1.8rem;">${p.name}</h1>

        <div class="product-rating" style="font-size:1rem; gap:0.5rem;">
          <span class="stars" style="font-size:1.1rem;">${renderStars(p.rating)}</span>
          <strong>${p.rating}</strong>
          <span style="color:var(--text-muted);">(${p.reviews} reviews)</span>
        </div>

        <div class="product-detail-price">${formatPrice(p.price)}</div>

        <div class="${inStock ? 'stock-indicator' : ''}" style="color:${inStock ? 'var(--success)' : 'var(--danger)'}">
          ${inStock
            ? `<span class="stock-dot"></span> In Stock (${p.stock} available)`
            : '❌ Out of Stock'}
        </div>

        <p class="product-detail-desc">${p.description}</p>

        ${inStock ? `
        <div style="display:flex; align-items:center; gap:1rem; flex-wrap:wrap;">
          <label style="font-weight:600; color:var(--text-secondary); font-size:0.875rem;">Quantity</label>
          <div class="qty-control">
            <button class="qty-btn" id="qty-down">−</button>
            <span class="qty-display" id="qty-val">1</span>
            <button class="qty-btn" id="qty-up">+</button>
          </div>
        </div>

        <div style="display:flex; gap:1rem; flex-wrap:wrap;">
          <button class="btn btn-primary btn-lg" id="add-cart-btn" style="flex:1;">
            🛒 Add to Cart
          </button>
          <a href="/cart.html" class="btn btn-secondary btn-lg">View Cart</a>
        </div>
        ` : `<button class="btn btn-secondary btn-lg" disabled>Out of Stock</button>`}

        <div style="display:flex; gap:2rem; padding:1rem; background:var(--glass); border:1px solid var(--glass-border); border-radius:var(--radius-md);">
          <div style="text-align:center;">
            <div style="font-size:1.2rem;">🚚</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">Free Shipping</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.2rem;">🔄</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">30-Day Returns</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.2rem;">🛡️</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">2-Year Warranty</div>
          </div>
          <div style="text-align:center;">
            <div style="font-size:1.2rem;">⚡</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.3rem;">Fast Delivery</div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (inStock) setupQtyControls(p.stock);
}

function setupQtyControls(maxStock) {
  const qtyVal  = document.getElementById('qty-val');
  const qtyDown = document.getElementById('qty-down');
  const qtyUp   = document.getElementById('qty-up');
  const addBtn  = document.getElementById('add-cart-btn');

  qtyDown.addEventListener('click', () => {
    if (selectedQty > 1) { selectedQty--; qtyVal.textContent = selectedQty; }
  });

  qtyUp.addEventListener('click', () => {
    if (selectedQty < maxStock) { selectedQty++; qtyVal.textContent = selectedQty; }
  });

  addBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to add items to cart', 'warning');
      setTimeout(() => location.href = '/auth.html', 1200);
      return;
    }

    addBtn.disabled = true;
    addBtn.textContent = '⏳ Adding…';

    try {
      await apiFetch('/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: selectedQty })
      });
      addBtn.textContent = '✅ Added to Cart!';
      showToast(`${product.name} × ${selectedQty} added to cart`, 'success');
      updateCartBadge();
      setTimeout(() => {
        addBtn.disabled = false;
        addBtn.textContent = '🛒 Add to Cart';
      }, 2500);
    } catch (err) {
      showToast(err.message, 'error');
      addBtn.disabled = false;
      addBtn.textContent = '🛒 Add to Cart';
    }
  });
}

function renderRelated(related) {
  const section = document.getElementById('related-section');
  const grid    = document.getElementById('related-grid');
  section.style.display = 'block';

  grid.innerHTML = related.map(p => `
    <div class="product-card" onclick="location.href='/product.html?id=${p.id}'">
      <div class="product-img-wrap">
        <img src="${p.image_url}" alt="${p.name}"
             onerror="this.src='https://placehold.co/400x400/1a1a2e/6c63ff?text=${encodeURIComponent(p.name.split(' ')[0])}'" />
        <span class="product-category-badge">${p.category}</span>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-rating">
          <span class="stars">${renderStars(p.rating)}</span>
          <span>${p.rating}</span>
        </div>
        <div class="product-footer">
          <div class="product-price">${formatPrice(p.price)}</div>
        </div>
      </div>
    </div>
  `).join('');
}
