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
    'audio': 250
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
  'audio': 'Audio'
};

let cart = { package: null, addons: new Set() };

function calcTotal() {
  if (!cart.package) return 0;
  let t = PRICES.packages[cart.package] || 0;
  cart.addons.forEach(a => { t += PRICES.addons[a] || 0; });
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
    if (cart.addons.size === 0) {
      addonsDisplay.textContent = 'No add-ons';
    } else {
      addonsDisplay.textContent = [...cart.addons].map(a => ADDON_LABELS[a] || a).join(', ');
    }
  }

  const total = calcTotal();
  if (totalDisplay) totalDisplay.textContent = '$' + total.toLocaleString();

  if (proceedBtn) {
    proceedBtn.onclick = () => {
      const page = PAYMENT_PAGES[cart.package];
      if (!page) return;
      const addonsStr = [...cart.addons].join(',');
      window.location.href = `${page}?package=${cart.package}&addons=${addonsStr}&total=${total}`;
    };
  }

  // Sync tier tiles
  document.querySelectorAll('.pkg-tier[data-tier]').forEach(t => {
    t.classList.toggle('selected', t.dataset.tier === cart.package);
  });

  // Sync addon toggles
  document.querySelectorAll('.addon-toggle[data-addon]').forEach(btn => {
    btn.classList.toggle('addon-toggle--active', cart.addons.has(btn.dataset.addon));
  });
}

function selectPackage(tier) {
  cart.package = tier;
  renderBar();
}

function toggleAddon(addonKey) {
  if (cart.addons.has(addonKey)) {
    cart.addons.delete(addonKey);
  } else {
    cart.addons.add(addonKey);
  }
  renderBar();
}

// Scroll-reveal via IntersectionObserver
function initScrollReveal() {
  const els = document.querySelectorAll('.wi-panel, .addon-btn-wrap, .compare-section, .cart-section');
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
