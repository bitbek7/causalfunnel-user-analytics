/**
 * CausalFunnel Demo Store - Cart & Telemetry Manager
 * Provides persistent cart storage, interactive slide-over drawer, and telemetry synchronization.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'cf_user_cart';
  const CATALOG_MAP = {
    'prod_echo_dot': { name: 'Echo Dot Smart Speaker', category: 'Smart Home', price: 49.99, emoji: '🎙️' },
    'prod_ring_doorbell': { name: 'Ring Video Doorbell', category: 'Smart Home', price: 99.99, emoji: '🔔' },
    'prod_fire_tv_stick': { name: 'Fire TV Stick 4K Max', category: 'Smart Home', price: 59.99, emoji: '📺' },
    'prod_kindle_paperwhite': { name: 'Kindle Paperwhite (16 GB)', category: 'E-Readers & Books', price: 139.99, emoji: '📖' },
    'prod_instant_pot': { name: 'Instant Pot Pro 10-in-1', category: 'Home & Kitchen', price: 129.95, emoji: '🍳' },
    'prod_ninja_airfryer': { name: 'Ninja DualZone Air Fryer', category: 'Home & Kitchen', price: 179.99, emoji: '🍟' },
    'prod_fitbit_charge': { name: 'Fitbit Charge 6 Tracker', category: 'Sports & Wearables', price: 159.95, emoji: '⌚' },
    'prod_yeti_tumbler': { name: 'YETI Rambler 30 oz Tumbler', category: 'Sports & Wearables', price: 38.00, emoji: '🥤' },
    // Backward compatibility:
    'prod_aura_pro': { name: 'Aura Pro Studio', category: 'Over-Ear ANC', price: 349.00, emoji: '🎧' },
    'prod_aura_air': { name: 'Aura Air Pods', category: 'Wireless Earbuds', price: 199.00, emoji: '🎵' },
    'prod_aura_stage': { name: 'Aura Stage 360', category: 'Home Speaker', price: 499.00, emoji: '📻' },
    'prod_aura_bass': { name: 'Aura Bass Sub', category: 'Subwoofer', price: 399.00, emoji: '🔊' }
  };

  function getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
    updateCartUI();
  }

  function getCartItemCount() {
    const cart = getCart();
    return Object.values(cart).reduce((total, item) => total + (item.quantity || 1), 0);
  }

  function getCartSubtotal() {
    const cart = getCart();
    return Object.values(cart).reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
  }

  function updateCartUI() {
    const totalCount = getCartItemCount();
    const counters = document.querySelectorAll('#cart-counter, .cart-counter-val');
    counters.forEach(el => {
      el.innerText = totalCount;
    });

    const drawerCountBadge = document.getElementById('drawer-cart-count');
    if (drawerCountBadge) {
      drawerCountBadge.innerText = totalCount;
    }

    renderCartDrawerItems();
  }

  function showCartToast(itemName) {
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.className = 'cart-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">🛒</span>
        <div class="toast-text">
          <strong>Added to Cart!</strong>
          <span>${itemName} was added.</span>
        </div>
      </div>
      <button class="toast-btn" id="toast-view-cart">View Cart</button>
    `;
    toast.classList.add('visible');

    const viewBtn = toast.querySelector('#toast-view-cart');
    if (viewBtn) {
      viewBtn.onclick = function() {
        toast.classList.remove('visible');
        openCartDrawer();
      };
    }

    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3500);
  }

  function addItemToCart(productId, productName, productCategory, price, emoji) {
    const cart = getCart();
    const defaultMeta = CATALOG_MAP[productId] || { name: productName || 'Audio Product', category: productCategory || 'Audio', price: price || 299, emoji: emoji || '🎧' };

    const resolvedPrice = price || defaultMeta.price || 299;
    const resolvedName = productName || defaultMeta.name;
    const resolvedCategory = productCategory || defaultMeta.category;
    const resolvedEmoji = emoji || defaultMeta.emoji || '🎧';

    if (cart[productId]) {
      cart[productId].quantity = (cart[productId].quantity || 1) + 1;
    } else {
      cart[productId] = {
        productId,
        productName: resolvedName,
        productCategory: resolvedCategory,
        price: resolvedPrice,
        emoji: resolvedEmoji,
        quantity: 1,
        addedAt: Date.now()
      };
    }

    saveCart(cart);
    showCartToast(resolvedName);

    // Dispatch real telemetry
    if (window.CausalTracker && typeof window.CausalTracker.trackAddToCart === 'function') {
      window.CausalTracker.trackAddToCart({
        productId,
        productName: resolvedName,
        productCategory: resolvedCategory
      });
    }
  }

  function updateItemQuantity(productId, delta) {
    const cart = getCart();
    if (!cart[productId]) return;

    cart[productId].quantity = (cart[productId].quantity || 1) + delta;
    if (cart[productId].quantity <= 0) {
      delete cart[productId];
    }
    saveCart(cart);
  }

  function removeItemFromCart(productId) {
    const cart = getCart();
    if (cart[productId]) {
      delete cart[productId];
      saveCart(cart);
    }
  }

  function clearCart() {
    saveCart({});
  }

  function openCartDrawer() {
    updateCartUI();
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function renderCartDrawerItems() {
    const container = document.getElementById('cart-items-container');
    const footer = document.getElementById('cart-drawer-footer');
    if (!container) return;

    const cart = getCart();
    const items = Object.values(cart);

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <div class="empty-icon">🛍️</div>
          <h3>Your Cart is Empty</h3>
          <p>Add products from the catalog to see them here and generate real client telemetry!</p>
        </div>
      `;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    let html = '<div class="cart-items-list">';
    items.forEach(item => {
      const itemTotal = (item.price * (item.quantity || 1)).toFixed(2);
      html += `
        <div class="cart-item-row" data-id="${item.productId}">
          <div class="cart-item-thumb">${item.emoji || '🎧'}</div>
          <div class="cart-item-info">
            <span class="cart-item-category">${item.productCategory || 'Audio'}</span>
            <h4 class="cart-item-title">${item.productName}</h4>
            <div class="cart-item-price-unit">$${Number(item.price).toFixed(2)} each</div>
          </div>
          <div class="cart-item-actions">
            <div class="cart-qty-stepper">
              <button class="btn-qty" onclick="window.CartManager.updateQty('${item.productId}', -1)" title="Decrease Quantity">&minus;</button>
              <span class="qty-display">${item.quantity || 1}</span>
              <button class="btn-qty" onclick="window.CartManager.updateQty('${item.productId}', 1)" title="Increase Quantity">&plus;</button>
            </div>
            <div class="cart-item-total">$${itemTotal}</div>
            <button class="btn-item-remove" onclick="window.CartManager.removeItem('${item.productId}')" title="Remove Item">&times;</button>
          </div>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;

    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');
    const subtotal = getCartSubtotal();
    if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `$${subtotal.toFixed(2)}`;
  }

  function injectCartDOM() {
    if (document.getElementById('cart-drawer')) return;

    const drawerHTML = `
      <div class="cart-backdrop" id="cart-backdrop"></div>
      <aside class="cart-drawer" id="cart-drawer" aria-label="Shopping Cart Drawer">
        <div class="cart-drawer-header">
          <div class="cart-header-title">
            <span class="cart-title-icon">🛒</span>
            <h3>Shopping Cart</h3>
            <span class="cart-count-badge" id="drawer-cart-count">0</span>
          </div>
          <button class="cart-close-btn" id="btn-close-cart" title="Close Cart">&times;</button>
        </div>

        <div class="cart-drawer-body" id="cart-items-container">
          <!-- Items rendered dynamically -->
        </div>

        <div class="cart-drawer-footer" id="cart-drawer-footer">
          <div class="cart-summary-line">
            <span>Subtotal</span>
            <span id="cart-subtotal">$0.00</span>
          </div>
          <div class="cart-summary-line free-shipping-line">
            <span>Standard Shipping</span>
            <span class="free-badge">FREE</span>
          </div>
          <div class="cart-summary-line total-line">
            <span>Total</span>
            <span id="cart-total">$0.00</span>
          </div>

          <button class="btn-checkout" id="btn-cart-checkout">
            <span>Proceed to Checkout</span>
            <span class="checkout-arrow">&rarr;</span>
          </button>
          <button class="btn-continue-shopping" id="btn-continue-shopping">
            Continue Shopping
          </button>
        </div>
      </aside>
    `;

    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    // Event listeners
    const backdrop = document.getElementById('cart-backdrop');
    const closeBtn = document.getElementById('btn-close-cart');
    const continueBtn = document.getElementById('btn-continue-shopping');
    const checkoutBtn = document.getElementById('btn-cart-checkout');

    if (backdrop) backdrop.addEventListener('click', closeCartDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);
    if (continueBtn) continueBtn.addEventListener('click', closeCartDrawer);

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', function () {
        alert('🎉 Checkout successful! Telemetry interactions were recorded and sent to the User Analytics App.');
        closeCartDrawer();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeCartDrawer();
    });
  }

  function bindCartButton() {
    const btnCart = document.getElementById('btn-cart');
    if (btnCart) {
      btnCart.onclick = function (e) {
        e.preventDefault();
        openCartDrawer();
      };
    }
  }

  // Initialize and synchronize across navigation / tabs
  document.addEventListener('DOMContentLoaded', function () {
    injectCartDOM();
    bindCartButton();
    updateCartUI();
  });

  window.addEventListener('pageshow', function () {
    bindCartButton();
    updateCartUI();
  });

  window.addEventListener('focus', updateCartUI);
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      updateCartUI();
    }
  });

  window.addEventListener('storage', function (e) {
    if (e.key === STORAGE_KEY) {
      updateCartUI();
    }
  });

  // Global Cart Manager API
  window.CartManager = {
    getCart,
    addItem: addItemToCart,
    removeItem: removeItemFromCart,
    updateQty: updateItemQuantity,
    clear: clearCart,
    open: openCartDrawer,
    close: closeCartDrawer,
    refresh: updateCartUI
  };

  // Expose global handleAddToCart so existing product card onclick handlers work seamlessly
  window.handleAddToCart = function (productId, productName, productCategory, price, emoji, ev) {
    const e = ev || window.event;
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    addItemToCart(productId, productName, productCategory, price, emoji);
  };

})();
