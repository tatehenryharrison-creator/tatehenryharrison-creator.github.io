/* pricing-cart.js — shared cart logic for all pricing pages */

const PRICES = {
  packages: {
    chapter: 800, novel: 1400, epic: 2400,
    portraiture: 350, 'product-brand': 500,
    hybrid: 1200, multiday: 2200, campaign: 3800
  },
  addons: {
    'vintage-glass': 150,
    'film-35mm': 200,
    'macro': 100,
    'drone': 300,
    'audio': 250,
    'lighting': 200,
    'longform': 300,
    'broll': 150,
    'extra-revision': 75,
    'plus-3min': 150,
    'extra-retouching': 50,
    'plus-5selects': 75
  }
};

const PAYMENT_PAGES = {
  chapter: 'payment-chapter.html',
  novel: 'payment-novel.html',
  epic: 'payment-epic.html',
  portraiture: 'payment-portraiture.html',
  'product-brand': 'payment-product-brand.html',
  hybrid: 'payment-custom.html',
  multiday: 'payment-custom.html',
  campaign: 'payment-custom.html'
};

const PACKAGE_LABELS = {
  chapter: 'Chapter', novel: 'Novel', epic: 'Epic',
  portraiture: 'Portraiture', 'product-brand': 'Product / Brand',
  hybrid: 'Hybrid', multiday: 'Multi-Day', campaign: 'Campaign'
};

const ADDON_LABELS = {
  'vintage-glass': 'Vintage Glass',
  'film-35mm': '35mm Film',
  'macro': 'Macro',
  'drone': 'Drone',
  'audio': 'Audio',
  'lighting': 'Lighting',
  'longform': 'Long-Form Video',
  'broll': 'B-Roll',
  'extra-revision': 'Extra Revision',
  'plus-3min': '+3 Min Edit',
  'extra-retouching': 'Extra Retouching',
  'plus-5selects': '+5 Selects'
};

// addons is now a plain object: { key: quantity }
let cart = { package: null, addons: {} };

function calcTotal() {
  if (!cart.package) return 0;
  let t = PRICES.packages[cart.package] || 0;
  Object.entries(cart.addons).forEach(([key, qty]) => {
    if (qty > 0) t += (PRICES.addons[key] || 0) * qty;
  });
  return t;
}

function renderBar() {
  const bar = document.getElementById('cart-bar');
  if (!bar) return;
  const pkgDisplay = document.getElementById('cb-package');
  const addonsDisplay = document.getElementById('cb-addons');
  const totalDisplay = document.getElementById('cb-total');
  const proceedBtn = document.getElementById('cb-proceed');

  if (!cart.package) {
    bar.classList.remove('cart-bar--visible');
    return;
  }

  bar.classList.add('cart-bar--visible');
  if (pkgDisplay) pkgDisplay.textContent = PACKAGE_LABELS[cart.package] || cart.package;

  if (addonsDisplay) {
    const active = Object.entries(cart.addons)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => qty > 1 ? `${ADDON_LABELS[key] || key} ×${qty}` : (ADDON_LABELS[key] || key));
    addonsDisplay.textContent = active.length ? active.join(', ') : 'No add-ons';
  }

  const total = calcTotal();
  if (totalDisplay) totalDisplay.style.display = 'none';

  if (proceedBtn) {
    proceedBtn.onclick = () => {
      const page = PAYMENT_PAGES[cart.package];
      if (!page) return;
      // Encode addons as key:qty pairs, omit zero-qty
      const addonsArr = Object.entries(cart.addons)
        .filter(([, qty]) => qty > 0)
        .map(([key, qty]) => qty > 1 ? `${key}:${qty}` : key);
      window.location.href = `${page}?package=${cart.package}&addons=${addonsArr.join(',')}`;
    };
  }

  // Sync tier tiles
  document.querySelectorAll('.pkg-tier[data-tier]').forEach(t => {
    t.classList.toggle('selected', t.dataset.tier === cart.package);
  });

  // Sync addon toggle buttons
  document.querySelectorAll('.addon-toggle[data-addon]').forEach(btn => {
    const key = btn.dataset.addon;
    const qty = cart.addons[key] || 0;
    btn.classList.toggle('addon-toggle--active', qty > 0);
  });

  // Sync qty displays in bottom cart
  document.querySelectorAll('.cart-qty-display[data-addon]').forEach(el => {
    el.textContent = cart.addons[el.dataset.addon] || 0;
  });
}

function selectPackage(tier) {
  cart.package = tier;
  renderBar();
}

// For toggle-style addons (qty 0 or 1)
function toggleAddon(addonKey) {
  cart.addons[addonKey] = (cart.addons[addonKey] || 0) > 0 ? 0 : 1;
  renderBar();
}

// For quantity-based addons — delta is +1 or -1
function setAddonQty(key, delta) {
  const current = cart.addons[key] || 0;
  const next = Math.max(0, current + delta);
  cart.addons[key] = next;
  // Update qty displays inside panels
  const panelQty = document.getElementById('qty-' + key);
  if (panelQty) panelQty.textContent = next;
  // Update the fold-out button state
  const foldBtn = document.querySelector(`.addon-fold-btn[data-key="${key}"]`);
  if (foldBtn) foldBtn.classList.toggle('active', next > 0);
  // Update add-btn label if present
  updateAddonQtyBtn(key, next);
  renderBar();
}

function updateAddonQtyBtn(key, qty) {
  const btn = document.getElementById('btn-' + key);
  if (!btn) return;
  if (qty > 0) {
    btn.textContent = `Added ×${qty} ✓`;
    btn.classList.add('added');
  } else {
    const price = PRICES.addons[key] || 0;
    const labels = {
      'extra-revision': 'Add Revisions',
      'plus-3min': 'Add Length',
      'extra-retouching': 'Add Retouching',
      'plus-5selects': 'Add Selects'
    };
    btn.textContent = labels[key] || 'Add to Order';
    btn.classList.remove('added');
  }
}

// Scroll-reveal via IntersectionObserver
function initScrollReveal() {
  const els = document.querySelectorAll('.acc-item, .addon-btn-wrap, .compare-section, .cart-section');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  els.forEach(el => obs.observe(el));
}

// Macro collage scroll zoom
function initCollageZoom() {
  const zoom = document.getElementById('collage-zoom-img');
  if (!zoom) return;
  const collage = document.getElementById('macro-collage');
  if (!collage) return;
  window.addEventListener('scroll', () => {
    const rect = collage.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
    const scale = 1 + progress * 0.28;
    zoom.style.transform = `scale(${scale})`;
  }, { passive: true });
}

// Add-on fold-out buttons
function toggleAddonPanel(key) {
  const panel = document.getElementById('addon-panel-' + key);
  if (!panel) return;
  const isOpen = panel.classList.contains('addon-panel--open');
  // Close all panels
  document.querySelectorAll('.addon-panel').forEach(p => {
    p.classList.remove('addon-panel--open');
    p.style.maxHeight = '0';
  });
  document.querySelectorAll('.addon-fold-btn').forEach(b => b.classList.remove('active'));
  if (!isOpen) {
    panel.classList.add('addon-panel--open');
    panel.style.maxHeight = panel.scrollHeight + 'px';
    const btn = document.querySelector(`.addon-fold-btn[data-key="${key}"]`);
    if (btn) btn.classList.add('active');
    // If a qty add-on is already active, re-apply active state
    if ((cart.addons[key] || 0) > 0 && btn) btn.classList.add('active');
  }
}

// Comparison table fold-out
function toggleCompare() {
  const table = document.getElementById('compare-table');
  const btn = document.getElementById('compare-toggle-btn');
  if (!table) return;
  const isOpen = table.classList.contains('compare-table--open');
  table.classList.toggle('compare-table--open', !isOpen);
  table.style.maxHeight = isOpen ? '0' : table.scrollHeight + 'px';
  if (btn) btn.textContent = isOpen ? 'View Full Comparison ↓' : 'Hide Comparison ↑';
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCollageZoom();
});
