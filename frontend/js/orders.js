/* orders.js */

document.addEventListener('DOMContentLoaded', () => {
  initNavAuth();
  const token = localStorage.getItem('token');
  if (!token) {
    document.getElementById('orders-root').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <h3>Please log in to view your orders</h3>
        <a href="/auth.html" class="btn btn-primary mt-3">Login / Register</a>
      </div>`;
    return;
  }
  loadOrders();
});

function initNavAuth() {
  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || 'null');
  const navAuth   = document.getElementById('nav-auth');
  const navUser   = document.getElementById('nav-user');
  const navLogout = document.getElementById('nav-logout');

  if (token && user) {
    navAuth.style.display   = 'none';
    navUser.style.display   = 'flex';
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

async function loadOrders() {
  try {
    const orders = await apiFetch('/orders');
    renderOrders(orders);
  } catch (err) {
    showToast('Failed to load orders', 'error');
  }
}

function renderOrders(orders) {
  const root = document.getElementById('orders-root');

  if (orders.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your order history will appear here once you make a purchase.</p>
        <a href="/" class="btn btn-primary mt-3">Start Shopping</a>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div style="margin-bottom:1rem;">
      <strong>${orders.length}</strong> order${orders.length !== 1 ? 's' : ''} found
    </div>
    <div class="orders-table">
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Date</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="orders-tbody">
          ${orders.map(o => `
            <tr>
              <td><strong>#${o.id}</strong></td>
              <td>${formatDate(o.created_at)}</td>
              <td>${o.item_count} item${o.item_count !== 1 ? 's' : ''}</td>
              <td style="font-weight:700; color:var(--accent);">${formatPrice(o.total)}</td>
              <td>${renderStatusBadge(o.status)}</td>
              <td>
                <button class="btn btn-outline btn-sm view-order-btn" data-id="${o.id}">
                  View Details
                </button>
              </td>
            </tr>
            <tr id="order-detail-${o.id}" style="display:none;">
              <td colspan="6" style="padding:0;">
                <div id="order-detail-content-${o.id}" style="padding:1.5rem; background:var(--bg-elevated); border-top:1px solid var(--glass-border);">
                  <div class="spinner" style="width:24px; height:24px; margin:1rem auto;"></div>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.querySelectorAll('.view-order-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleOrderDetail(btn.dataset.id, btn));
  });
}

const expandedOrders = new Set();

async function toggleOrderDetail(orderId, btn) {
  const row = document.getElementById(`order-detail-${orderId}`);
  const content = document.getElementById(`order-detail-content-${orderId}`);

  if (expandedOrders.has(orderId)) {
    row.style.display = 'none';
    expandedOrders.delete(orderId);
    btn.textContent = 'View Details';
    return;
  }

  row.style.display = 'table-row';
  expandedOrders.add(orderId);
  btn.textContent = 'Hide Details';

  try {
    const order = await apiFetch(`/orders/${orderId}`);
    content.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:2rem; flex-wrap:wrap;">
        <div>
          <h4 style="margin-bottom:1rem; color:var(--accent);">📦 Items Ordered</h4>
          <div style="display:flex; flex-direction:column; gap:0.75rem;">
            ${order.items.map(item => `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:var(--bg-card); border-radius:var(--radius-md); border:1px solid var(--glass-border);">
                <div>
                  <div style="font-weight:600; font-size:0.9rem;">${item.name}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted);">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
                </div>
                <div style="font-weight:700;">${formatPrice(item.price * item.quantity)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <div>
          <h4 style="margin-bottom:1rem; color:var(--accent);">🚚 Shipping Details</h4>
          <div style="background:var(--bg-card); border:1px solid var(--glass-border); border-radius:var(--radius-md); padding:1rem; display:flex; flex-direction:column; gap:0.5rem; font-size:0.875rem;">
            <div><span style="color:var(--text-muted);">Name:</span> <strong>${order.shipping_name || '—'}</strong></div>
            <div><span style="color:var(--text-muted);">Address:</span> <strong>${order.shipping_address || '—'}</strong></div>
            <div><span style="color:var(--text-muted);">City:</span> <strong>${order.shipping_city || '—'}, ${order.shipping_zip || ''}</strong></div>
            <div><span style="color:var(--text-muted);">Payment:</span> <strong>${order.payment_method || '—'}</strong></div>
            <div><span style="color:var(--text-muted);">Total:</span> <strong style="color:var(--accent); font-size:1rem;">${formatPrice(order.total)}</strong></div>
          </div>
        </div>
      </div>
    `;
  } catch {
    content.innerHTML = `<p style="color:var(--danger); padding:1rem;">Failed to load order details.</p>`;
  }
}

function renderStatusBadge(status) {
  const map = {
    'Processing': 'badge-warning',
    'Shipped':    'badge-info',
    'Delivered':  'badge-success',
    'Cancelled':  'badge-danger',
  };
  return `<span class="badge ${map[status] || 'badge-purple'}">${status}</span>`;
}
