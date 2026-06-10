/* products.js — Homepage product listing */

let allProducts = [];
let activeCategory = 'All';
let searchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initNavAuth();
  loadProducts();
  setupSearch();
  setupCategoryTabs();
});

/* ── Auth Nav ──────────────────────────────────────────── */
function initNavAuth() {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');

  const navAuth   = document.getElementById('nav-auth');
  const navUser   = document.getElementById('nav-user');
  const navLogout = document.getElementById('nav-logout');
  const navOrders = document.getElementById('nav-orders');
  const heroBtn   = document.getElementById('hero-auth-btn');

  if (token && user) {
    navAuth.style.display   = 'none';
    navUser.style.display   = 'flex';
    navOrders.style.display = 'block';
    navUser.textContent     = `👋 ${user.name.split(' ')[0]}`;
    if (heroBtn) heroBtn.textContent = '📦 My Orders';
    if (heroBtn) heroBtn.href = '/orders.html';

    navLogout.style.display = 'block';
    navLogout.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.reload();
    });
  }

  updateCartBadge();
}

/* ── Load Products ─────────────────────────────────────── */
async function loadProducts() {
  try {
    allProducts = await apiFetch('/products');
    renderProducts();
    document.getElementById('product-count').textContent =
      `${allProducts.length} products`;
  } catch (err) {
    showToast('Failed to load products', 'error');
    document.getElementById('products-grid').innerHTML =
      `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Could not load products</h3>
        <p>Please refresh the page</p>
      </div>`;
  }
}

/* ── Render Products ───────────────────────────────────── */
function renderProducts() {
  const filtered = allProducts.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const grid = document.getElementById('products-grid');
  document.getElementById('product-count').textContent =
    `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">🔍</div>
        <h3>No products found</h3>
        <p>Try a different search or category</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
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
          <span>${p.rating} (${p.reviews})</span>
        </div>
        <div class="product-footer">
          <div class="product-price">${formatPrice(p.price)}</div>
          <button class="add-cart-btn" onclick="handleAddToCart(event, ${p.id}, '${p.name.replace(/'/g, "\\'")}')">
            🛒 Add
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

/* ── Add to Cart ───────────────────────────────────────── */
async function handleAddToCart(e, productId, productName) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const token = localStorage.getItem('token');

  if (!token) {
    showToast('Please login to add items to cart', 'warning');
    setTimeout(() => location.href = '/auth.html', 1200);
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Adding…';

  try {
    await apiFetch('/cart', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });
    btn.classList.add('added');
    btn.textContent = '✅ Added!';
    showToast(`${productName} added to cart`, 'success');
    updateCartBadge();
    setTimeout(() => {
      btn.classList.remove('added');
      btn.disabled = false;
      btn.textContent = '🛒 Add';
    }, 2000);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = '🛒 Add';
  }
}

/* ── Category Tabs ─────────────────────────────────────── */
function setupCategoryTabs() {
  document.getElementById('category-tabs').addEventListener('click', (e) => {
    if (!e.target.matches('.tab-btn')) return;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    activeCategory = e.target.dataset.cat;
    renderProducts();
  });
}

/* ── Search ────────────────────────────────────────────── */
function setupSearch() {
  const input = document.getElementById('search-input');
  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = input.value.trim();
      renderProducts();
    }, 300);
  });
}
