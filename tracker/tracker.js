/**
 * CausalFunnel Client-Side Tracking SDK (tracker.js)
 *
 * Lightweight, zero-dependency telemetry SDK designed for high-throughput
 * e-commerce behavioral analytics.
 *
 * Features:
 * - Tab-scoped session persistence using sessionStorage
 * - Automatic page_view event on initialization
 * - Global document click capture recording pageX, pageY coordinates
 * - Non-blocking asynchronous JSON event dispatch via fetch()
 * - Safe error boundaries: never interrupts or breaks host page functionality
 * - Configurable via <script data-api-endpoint="..."> attribute
 */
(function (window, document) {
  'use strict';

  // Configuration Constants
  const STORAGE_KEY = 'cf_session_id';
  const DEFAULT_ENDPOINT = 'http://localhost:5000/api/events';

  /**
   * Resolve ingestion endpoint from script tag attributes or sensible defaults
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

      // If running on the same domain as the API
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
   * Retrieve existing session ID from sessionStorage or generate a fresh unique one
   * Pattern: cf_sess_<timestamp>_<base36_random>
   */
  function getOrCreateSessionId() {
    try {
      let sessionId = sessionStorage.getItem(STORAGE_KEY);
      if (!sessionId) {
        sessionId =
          'cf_' +
          Date.now().toString(36) +
          '_' +
          Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem(STORAGE_KEY, sessionId);
      }
      return sessionId;
    } catch (err) {
      // In case cookies/storage are blocked by user privacy modes
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

      // Prefer native fetch with keepalive to survive rapid page navigations
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
            if (!response.ok) {
              console.warn('[CausalFunnel Tracker] Ingestion responded with status:', response.status);
            }
          })
          .catch((networkErr) => {
            // Fail silently to avoid breaking the host page
            console.debug('[CausalFunnel Tracker] Network dispatch error:', networkErr.message);
          });
      }

      // Notify any local UI widgets (such as the demo page HUD)
      if (typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('cf_event_tracked', {
            detail: payload
          })
        );
      }
    } catch (err) {
      console.debug('[CausalFunnel Tracker] Dispatch failed silently:', err);
    }
  }

  /**
   * Record a page_view event
   */
  function trackPageView() {
    const payload = {
      sessionId: sessionId,
      eventType: 'page_view',
      pageUrl: window.location.pathname || '/',
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth || document.documentElement.clientWidth,
        height: window.innerHeight || document.documentElement.clientHeight
      }
    };

    dispatchEvent(payload);
  }

  /**
   * Record a click event with page-relative coordinates (x, y)
   */
  function trackClick(event) {
    try {
      // Calculate document-relative coordinates (handling scrolling)
      let pageX =
        event.pageX !== undefined && event.pageX !== null
          ? event.pageX
          : event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);

      let pageY =
        event.pageY !== undefined && event.pageY !== null
          ? event.pageY
          : event.clientY + (document.documentElement.scrollTop || document.body.scrollTop);

      const target = event.target || {};

      // Robust Coordinate Resolution:
      // In synthetic clicks (e.g. element.click()) or keyboard activation (Enter/Space on focused buttons),
      // browser MouseEvents often arrive with pageX = 0, pageY = 0 or clientX = 0.
      // If the target element has non-zero bounding box coordinates, resolve the exact center of the clicked element!
      if (typeof target.getBoundingClientRect === 'function') {
        const rect = target.getBoundingClientRect();
        if (rect.width > 0 || rect.height > 0) {
          const scrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
          const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

          // If coordinates are 0 while element is positioned elsewhere on screen, use element center
          if (pageX === 0 && rect.left > 0) {
            pageX = Math.round(rect.left + scrollX + rect.width / 2);
          }
          if (pageY === 0 && rect.top > 0) {
            pageY = Math.round(rect.top + scrollY + rect.height / 2);
          }
          // If both coordinates were 0 (top-left fallback), resolve fully to element center
          if (pageX === 0 && pageY === 0) {
            pageX = Math.round(rect.left + scrollX + rect.width / 2);
            pageY = Math.round(rect.top + scrollY + rect.height / 2);
          }
        }
      }

      // Extract brief non-PII target metadata for richer analytical context
      const tagName = (target.tagName || 'UNKNOWN').toUpperCase();
      let textSnippet = '';

      if (target.innerText) {
        textSnippet = target.innerText.trim().slice(0, 60);
      } else if (target.value) {
        textSnippet = String(target.value).trim().slice(0, 60);
      } else if (target.alt) {
        textSnippet = String(target.alt).trim().slice(0, 60);
      }

      const payload = {
        sessionId: sessionId,
        eventType: 'click',
        pageUrl: window.location.pathname || '/',
        timestamp: new Date().toISOString(),
        x: Math.round(pageX),
        y: Math.round(pageY),
        viewport: {
          width: window.innerWidth || document.documentElement.clientWidth,
          height: window.innerHeight || document.documentElement.clientHeight
        },
        elementTag: tagName,
        elementText: textSnippet
      };

      dispatchEvent(payload);
    } catch (err) {
      console.debug('[CausalFunnel Tracker] Click tracking exception:', err);
    }
  }

  /**
   * Initialize Tracker
   */
  function initialize() {
    // 1. Dispatch initial page_view event
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      trackPageView();
    } else {
      window.addEventListener('DOMContentLoaded', trackPageView, { once: true });
    }

    // 2. Attach global document click listener
    document.addEventListener('click', trackClick, { passive: true, capture: true });

    // Expose minimal diagnostics API onto window object
    window.CausalTracker = {
      version: '1.0.0',
      getSessionId: function () {
        return sessionId;
      },
      getEndpoint: function () {
        return API_ENDPOINT;
      },
      trackCustomPageView: trackPageView
    };

    console.log(`[CausalFunnel Tracker v1.0.0] Active for session: ${sessionId} -> ${API_ENDPOINT}`);
  }

  initialize();
})(window, document);
