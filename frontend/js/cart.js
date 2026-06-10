/* cart.js */

let cartItems = [];

document.addEventListener('DOMContentLoaded', () => {
  initNavAuth();
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('cart-root').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <h3>Please log in to view your cart</h3>
        <p>You need an account to use the shopping cart</p>
        <a href="/auth.html" class="btn btn-primary mt-3">Login / Register</a>
      </div>`;
    return;
  }
  loadCart();
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

async function loadCart() {
  try {
    cartItems = await apiFetch('/cart');
    renderCart();
  } catch (err) {
    showToast('Failed to load cart', 'error');
  }
}

function renderCart() {
  const root = document.getElementById('cart-root');

  if (cartItems.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Start shopping to add items to your cart</p>
        <a href="/" class="btn btn-primary mt-3">Browse Products</a>
      </div>`;
    return;
  }

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax      = subtotal * 0.08;
  const total    = subtotal + tax;
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  root.innerHTML = `
    <div class="cart-layout">
      <div>
        <div class="flex-between" style="margin-bottom:1rem;">
          <h3>${itemCount} item${itemCount !== 1 ? 's' : ''} in your cart</h3>
          <button class="btn btn-danger btn-sm" id="clear-cart-btn">🗑️ Clear All</button>
        </div>
        <div class="cart-items-list" id="cart-items-list">
          ${cartItems.map(renderCartItem).join('')}
        </div>
      </div>

      <div class="cart-summary">
        <h3>Order Summary</h3>
        <div class="summary-row">
          <span>Subtotal (${itemCount} items)</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        <div class="summary-row">
          <span>Shipping</span>
          <span style="color:var(--success);">Free</span>
        </div>
        <div class="summary-row">
          <span>Tax (8%)</span>
          <span>${formatPrice(tax)}</span>
        </div>
        <div class="summary-row total">
          <span>Total</span>
          <span style="color:var(--accent);">${formatPrice(total)}</span>
        </div>
        <a href="/checkout.html" class="btn btn-primary btn-block btn-lg" style="margin-top:1.5rem;">
          Proceed to Checkout →
        </a>
        <a href="/" class="btn btn-secondary btn-block" style="margin-top:0.75rem;">
          ← Continue Shopping
        </a>
      </div>
    </div>
  `;

  // Clear all
  document.getElementById('clear-cart-btn').addEventListener('click', async () => {
    if (!confirm('Remove all items from cart?')) return;
    try {
      await apiFetch('/cart', { method: 'DELETE' });
      cartItems = [];
      renderCart();
      updateCartBadge();
      showToast('Cart cleared', 'info');
    } catch {
      showToast('Failed to clear cart', 'error');
    }
  });

  // Quantity buttons
  document.querySelectorAll('.qty-btn-cart').forEach(btn => {
    btn.addEventListener('click', () => handleQtyChange(
      btn.dataset.id, btn.dataset.action, btn.dataset.current, btn.dataset.stock
    ));
  });

  // Remove buttons
  document.querySelectorAll('.remove-item-btn').forEach(btn => {
    btn.addEventListener('click', () => handleRemove(btn.dataset.id));
  });
}

function renderCartItem(item) {
  const lineTotal = item.price * item.quantity;
  return `
    <div class="cart-item" id="cart-item-${item.id}">
      <div class="cart-item-img">
        <img src="${item.image_url}" alt="${item.name}"
             onerror="this.src='https://placehold.co/200x200/1a1a2e/6c63ff?text=${encodeURIComponent(item.name.split(' ')[0])}'" />
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">
          <a href="/product.html?id=${item.product_id}" style="color:inherit;">${item.name}</a>
        </div>
        <div class="cart-item-cat">${item.category}</div>
        <div class="cart-item-price">${formatPrice(item.price)} each</div>
      </div>
      <div class="cart-item-actions">
        <div style="font-weight:800; font-size:1rem; color:var(--accent);">${formatPrice(lineTotal)}</div>
        <div class="qty-control">
          <button class="qty-btn qty-btn-cart"
            data-id="${item.id}" data-action="down"
            data-current="${item.quantity}" data-stock="${item.stock}">−</button>
          <span class="qty-display">${item.quantity}</span>
          <button class="qty-btn qty-btn-cart"
            data-id="${item.id}" data-action="up"
            data-current="${item.quantity}" data-stock="${item.stock}">+</button>
        </div>
        <button class="btn btn-danger btn-sm remove-item-btn" data-id="${item.id}">
          🗑️ Remove
        </button>
      </div>
    </div>
  `;
}

async function handleQtyChange(id, action, current, stock) {
  const qty = parseInt(current);
  const newQty = action === 'up'
    ? Math.min(qty + 1, parseInt(stock))
    : Math.max(qty - 1, 1);

  if (newQty === qty) return;

  try {
    await apiFetch(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: newQty })
    });
    const item = cartItems.find(i => i.id == id);
    if (item) item.quantity = newQty;
    renderCart();
    updateCartBadge();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleRemove(id) {
  try {
    await apiFetch(`/cart/${id}`, { method: 'DELETE' });
    cartItems = cartItems.filter(i => i.id != id);
    renderCart();
    updateCartBadge();
    showToast('Item removed', 'info');
  } catch {
    showToast('Failed to remove item', 'error');
  }
}
