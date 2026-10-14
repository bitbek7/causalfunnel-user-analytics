/**
 * CausalFunnel Client-Side Tracking SDK (tracker.js)
 *
 * Lightweight, zero-dependency telemetry SDK for e-commerce analytics.
 *
 * Capabilities:
 * - Persistent session identification using localStorage (with sessionStorage fallback)
 * - Automatic, de-duplicated page_view recording with page title
 * - Full document-relative click tracking with exact (x, y) coordinates
 * - Product interaction tracking: add_to_cart, product_favorite, product_unfavorite
 * - Automatic product metadata extraction from DOM data-* attributes
 * - Safe non-blocking asynchronous dispatch via fetch()
 */
(function (window, document) {
  'use strict';

  // Prevent multiple initializations on the same page
  if (window.__CF_TRACKER_INITIALIZED__) {
    return;
  }
  window.__CF_TRACKER_INITIALIZED__ = true;

  const STORAGE_KEY = 'cf_session_id';
  const DEFAULT_ENDPOINT = 'http://localhost:5000/api/events';

  /**
   * Resolve ingestion endpoint from script tag or sensible default
   */
  function resolveApiEndpoint() {
    try {
      const currentScript =
        document.currentScript ||
        document.querySelector('script[data-api-endpoint]') ||
        document.querySelector('script[src*="tracker.js"]');

      if (currentScript && currentScript.getAttribute('data-api-endpoint')) {
        return currentScript.getAttribute('data-api-endpoint');
      }

      if (window.location.port === '5000') {
        return '/api/events';
      }
    } catch (e) {
      // Ignore error and use default
    }
    return DEFAULT_ENDPOINT;
  }

  const API_ENDPOINT = resolveApiEndpoint();

  /**
   * Persistent Session Identification
   * Uses localStorage so visitor retains the same session_id across page refreshes.
   * Falls back to sessionStorage if localStorage is restricted.
   */
  function getOrCreateSessionId() {
    try {
      let sessionId = localStorage.getItem(STORAGE_KEY);
      if (!sessionId) {
        sessionId = sessionStorage.getItem(STORAGE_KEY);
      }
      if (!sessionId) {
        sessionId =
          'cf_' +
          Date.now().toString(36) +
          '_' +
          Math.random().toString(36).substring(2, 9);
        try {
          localStorage.setItem(STORAGE_KEY, sessionId);
        } catch (e) {}
        try {
          sessionStorage.setItem(STORAGE_KEY, sessionId);
        } catch (e) {}
      }
      return sessionId;
    } catch (err) {
      return 'cf_volatile_' + Math.random().toString(36).substring(2, 9);
    }
  }

  const sessionId = getOrCreateSessionId();

  /**
   * Asynchronously send an event to the backend API
   */
  function dispatchEvent(payload) {
    try {
      const serialized = JSON.stringify(payload);

      if (typeof window.fetch === 'function') {
        fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: serialized,
          mode: 'cors',
          keepalive: true
        })
          .then((response) => {
            if (response.ok) {
              notifyLocalWidgets(payload, true);
            } else {
              console.warn('[CausalFunnel Tracker] API returned status:', response.status);
              notifyLocalWidgets(payload, false);
            }
          })
          .catch((networkErr) => {
            console.debug('[CausalFunnel Tracker] Network error:', networkErr.message);
            notifyLocalWidgets(payload, false);
          });
      } else {
        notifyLocalWidgets(payload, true);
      }
    } catch (err) {
      console.debug('[CausalFunnel Tracker] Dispatch failed silently:', err);
    }
  }

  /**
   * Notify local demo page HUD
   */
  function notifyLocalWidgets(payload, isSuccess) {
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('cf_event_tracked', {
          detail: { ...payload, success: isSuccess }
        })
      );
    }
  }

  /**
   * Find product context from an element or its ancestors
   */
  function extractProductContext(element) {
    if (!element || typeof element.closest !== 'function') return null;
    const card = element.closest('[data-product-id]');
    if (!card) return null;

    return {
      productId: card.getAttribute('data-product-id') || undefined,
      productName: card.getAttribute('data-product-name') || undefined,
      productCategory: card.getAttribute('data-product-category') || undefined
    };
  }

  /**
   * Record a page_view event
   */
  let pageViewRecorded = false;
  function trackPageView(customMeta) {
    if (pageViewRecorded) return;
    pageViewRecorded = true;

    const payload = {
      sessionId: sessionId,
      eventType: 'page_view',
      pageUrl: window.location.pathname || '/',
      pageTitle: document.title || 'Demo Store',
      timestamp: new Date().toISOString(),
      source: 'demo_store',
      viewport: {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
      },
      ...(customMeta || {})
    };

    dispatchEvent(payload);
  }

  /**
   * Record a click event with exact document-relative (x, y) coordinates
   */
  function trackClick(event) {
    try {
      const scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

      let pageX = event.pageX;
      let pageY = event.pageY;

      if (pageX === undefined || pageX === null) {
        pageX = event.clientX !== undefined ? event.clientX + scrollX : undefined;
      }
      if (pageY === undefined || pageY === null) {
        pageY = event.clientY !== undefined ? event.clientY + scrollY : undefined;
      }

      const target = event.target || {};

      // If synthetic click, keyboard event, or missing coordinates, resolve to element center
      if (typeof target.getBoundingClientRect === 'function') {
        const rect = target.getBoundingClientRect();
        if (pageX === undefined || pageX === null || pageX === 0 || isNaN(pageX)) {
          pageX = Math.round(rect.left + scrollX + (rect.width > 0 ? rect.width / 2 : 0));
        }
        if (pageY === undefined || pageY === null || pageY === 0 || isNaN(pageY)) {
          pageY = Math.round(rect.top + scrollY + (rect.height > 0 ? rect.height / 2 : 0));
        }
      }

      // Default safe coordinate if still missing
      if (pageX === undefined || isNaN(pageX)) pageX = 0;
      if (pageY === undefined || isNaN(pageY)) pageY = 0;


      const tagName = (target.tagName || 'UNKNOWN').toUpperCase();
      let textSnippet = '';

      if (target.innerText) {
        textSnippet = target.innerText.trim().slice(0, 60);
      } else if (target.value) {
        textSnippet = String(target.value).trim().slice(0, 60);
      }

      // Check if clicked element relates to a product
      const productContext = extractProductContext(target);

      const payload = {
        sessionId: sessionId,
        eventType: 'click',
        pageUrl: window.location.pathname || '/',
        pageTitle: document.title,
        timestamp: new Date().toISOString(),
        x: Math.round(pageX),
        y: Math.round(pageY),
        source: 'demo_store',
        elementTag: tagName,
        elementText: textSnippet,
        viewport: {
          width: window.innerWidth || document.documentElement.clientWidth,
          height: window.innerHeight || document.documentElement.clientHeight
        },
        ...(productContext || {})
      };

      dispatchEvent(payload);
    } catch (err) {
      console.debug('[CausalFunnel Tracker] Click tracking exception:', err);
    }
  }

  /**
   * Explicit Business Event Tracking APIs
   */
  function trackAddToCart(productData) {
    if (!productData || !productData.productId) return;

    const payload = {
      sessionId: sessionId,
      eventType: 'add_to_cart',
      pageUrl: window.location.pathname || '/',
      pageTitle: document.title,
      timestamp: new Date().toISOString(),
      productId: String(productData.productId),
      productName: String(productData.productName || productData.productId),
      productCategory: productData.productCategory || undefined,
      source: 'demo_store'
    };

    dispatchEvent(payload);
  }

  function trackFavorite(productData) {
    if (!productData || !productData.productId) return;

    const payload = {
      sessionId: sessionId,
      eventType: 'product_favorite',
      pageUrl: window.location.pathname || '/',
      pageTitle: document.title,
      timestamp: new Date().toISOString(),
      productId: String(productData.productId),
      productName: String(productData.productName || productData.productId),
      productCategory: productData.productCategory || undefined,
      source: 'demo_store'
    };

    dispatchEvent(payload);
  }

  function trackUnfavorite(productData) {
    if (!productData || !productData.productId) return;

    const payload = {
      sessionId: sessionId,
      eventType: 'product_unfavorite',
      pageUrl: window.location.pathname || '/',
      pageTitle: document.title,
      timestamp: new Date().toISOString(),
      productId: String(productData.productId),
      productName: String(productData.productName || productData.productId),
      productCategory: productData.productCategory || undefined,
      source: 'demo_store'
    };

    dispatchEvent(payload);
  }

  /**
   * Initialize Tracker
   */
  function initialize() {
    // 1. Initial Page View
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      trackPageView();
    } else {
      window.addEventListener('DOMContentLoaded', () => trackPageView(), { once: true });
    }

    // 2. Global Document Click Listener
    document.addEventListener('click', trackClick, { passive: true, capture: true });

    // Expose Global Public API onto window
    window.CausalTracker = {
      version: '1.1.0',
      getSessionId: () => sessionId,
      getEndpoint: () => API_ENDPOINT,
      trackPageView,
      trackAddToCart,
      trackFavorite,
      trackUnfavorite
    };

    console.log(`[CausalFunnel Tracker] Initialized for session: ${sessionId} -> ${API_ENDPOINT}`);
  }

  initialize();
})(window, document);
