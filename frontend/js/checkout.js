/* checkout.js */

let cartItems = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('checkout-root').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <h3>Please log in to checkout</h3>
        <a href="/auth.html" class="btn btn-primary mt-3">Login / Register</a>
      </div>`;
    return;
  }
  loadCheckout();
  updateCartBadge();
});

async function loadCheckout() {
  try {
    cartItems = await apiFetch('/cart');
    if (cartItems.length === 0) {
      document.getElementById('checkout-root').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <a href="/" class="btn btn-primary mt-3">Browse Products</a>
        </div>`;
      return;
    }
    renderCheckout();
  } catch (err) {
    showToast('Failed to load checkout', 'error');
  }
}

function renderCheckout() {
  const subtotal  = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax       = subtotal * 0.08;
  const total     = subtotal + tax;
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);

  document.getElementById('checkout-root').innerHTML = `
    <div class="checkout-layout">
      <!-- Left: Forms -->
      <div>
        <!-- Shipping -->
        <div class="form-section">
          <div class="form-section-title">📦 Shipping Information</div>
          <form id="checkout-form">
            <div class="form-group">
              <label for="shipping-name">Full Name</label>
              <input type="text" id="shipping-name" placeholder="John Doe" required />
            </div>
            <div class="form-group">
              <label for="shipping-address">Street Address</label>
              <input type="text" id="shipping-address" placeholder="123 Main St" required />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="shipping-city">City</label>
                <input type="text" id="shipping-city" placeholder="New York" required />
              </div>
              <div class="form-group">
                <label for="shipping-zip">ZIP Code</label>
                <input type="text" id="shipping-zip" placeholder="10001" required />
              </div>
            </div>

            <!-- Payment -->
            <div class="form-section-title" style="margin-top:1.5rem;">💳 Payment Details</div>
            <div class="form-group">
              <label for="payment-method">Payment Method</label>
              <select id="payment-method">
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="PayPal">PayPal</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
            <div class="form-group">
              <label for="card-number">Card Number</label>
              <input type="text" id="card-number" placeholder="**** **** **** ****" maxlength="19"
                oninput="this.value=this.value.replace(/[^0-9]/g,'').replace(/(.{4})/g,'$1 ').trim()" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="card-expiry">Expiry Date</label>
                <input type="text" id="card-expiry" placeholder="MM/YY" maxlength="5" />
              </div>
              <div class="form-group">
                <label for="card-cvv">CVV</label>
                <input type="text" id="card-cvv" placeholder="***" maxlength="3" />
              </div>
            </div>

            <div style="background:rgba(34,197,94,0.08); border:1px solid rgba(34,197,94,0.2); border-radius:var(--radius-md); padding:0.75rem 1rem; display:flex; align-items:center; gap:0.5rem; font-size:0.85rem; color:var(--success);">
              🔒 Your payment information is encrypted and secure. This is a simulated checkout.
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg" id="place-order-btn" style="margin-top:1.5rem;">
              Place Order — ${formatPrice(total)}
            </button>
          </form>
        </div>
      </div>

      <!-- Right: Summary -->
      <div class="order-summary-card">
        <h3 style="margin-bottom:1.25rem;">Order Summary</h3>
        ${cartItems.map(item => `
          <div class="order-summary-item">
            <div>
              <div style="font-weight:600; font-size:0.875rem;">${item.name}</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">Qty: ${item.quantity}</div>
            </div>
            <div style="font-weight:700; white-space:nowrap;">${formatPrice(item.price * item.quantity)}</div>
          </div>
        `).join('')}

        <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--glass-border);">
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
        </div>

        <div style="margin-top:1.5rem; display:flex; flex-direction:column; gap:0.5rem; font-size:0.8rem; color:var(--text-muted);">
          <div>✅ Free standard shipping</div>
          <div>✅ 30-day hassle-free returns</div>
          <div>✅ 2-year product warranty</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('checkout-form').addEventListener('submit', handlePlaceOrder);
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('place-order-btn');

  const shipping_name    = document.getElementById('shipping-name').value.trim();
  const shipping_address = document.getElementById('shipping-address').value.trim();
  const shipping_city    = document.getElementById('shipping-city').value.trim();
  const shipping_zip     = document.getElementById('shipping-zip').value.trim();
  const payment_method   = document.getElementById('payment-method').value;

  if (!shipping_name || !shipping_address || !shipping_city || !shipping_zip) {
    showToast('Please fill in all shipping fields', 'warning');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Processing Order…';

  try {
    const result = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({ shipping_name, shipping_address, shipping_city, shipping_zip, payment_method })
    });
    showSuccessOverlay(result.orderId, result.total);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = `Place Order — ${formatPrice(cartItems.reduce((s,i) => s + i.price * i.quantity, 0) * 1.08)}`;
  }
}

function showSuccessOverlay(orderId, total) {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-card">
      <div class="success-icon">🎉</div>
      <h2 style="margin-bottom:0.5rem;">Order Placed!</h2>
      <p style="margin-bottom:1rem;">Thank you for your purchase. Your order <strong>#${orderId}</strong> has been confirmed.</p>
      <div style="background:var(--glass); border:1px solid var(--glass-border); border-radius:var(--radius-md); padding:1rem; margin-bottom:1.5rem;">
        <div style="display:flex; justify-content:space-between; font-size:0.9rem;">
          <span style="color:var(--text-muted);">Order ID</span>
          <strong>#${orderId}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-top:0.5rem;">
          <span style="color:var(--text-muted);">Total Paid</span>
          <strong style="color:var(--accent);">${formatPrice(total)}</strong>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-top:0.5rem;">
          <span style="color:var(--text-muted);">Status</span>
          <span class="badge badge-warning">Processing</span>
        </div>
      </div>
      <div style="display:flex; gap:1rem; flex-wrap:wrap; justify-content:center;">
        <a href="/orders.html" class="btn btn-primary">View My Orders</a>
        <a href="/" class="btn btn-secondary">Continue Shopping</a>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}
