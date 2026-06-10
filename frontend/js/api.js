/* ── Shared API Utilities ────────────────────────────────────────── */

const API_BASE = '/api';

/**
 * Centralized fetch wrapper — auto-attaches JWT, parses JSON, throws on error
 */
async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

/* ── Toast Notification System ────────────────────────────────────── */

(function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'toast-container';
    document.body.appendChild(el);
  }
})();

const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || 'ℹ️'}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

/* ── Cart Count Helper ─────────────────────────────────────────────── */

async function updateCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;
  const token = localStorage.getItem('token');
  if (!token) { badge.style.display = 'none'; return; }
  try {
    const items = await apiFetch('/cart');
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch {
    badge.style.display = 'none';
  }
}

/* ── Stars renderer ────────────────────────────────────────────────── */
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

/* ── Format currency ───────────────────────────────────────────────── */
function formatPrice(n) {
  return '$' + parseFloat(n).toFixed(2);
}

/* ── Format date ───────────────────────────────────────────────────── */
function formatDate(str) {
  return new Date(str).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}
