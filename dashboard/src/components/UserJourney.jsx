import React, { useState, useMemo } from 'react';

function formatTimestamp(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function getProductEmoji(name = '', category = '') {
  const text = (name + ' ' + category).toLowerCase();
  if (text.includes('kindle') || text.includes('book') || text.includes('reader')) return '📖';
  if (text.includes('pot') || text.includes('cooker') || text.includes('kitchen') || text.includes('fryer')) return '🍳';
  if (text.includes('fitbit') || text.includes('watch') || text.includes('wearable') || text.includes('tracker')) return '⌚';
  if (text.includes('ring') || text.includes('doorbell') || text.includes('security')) return '🔔';
  if (text.includes('tv') || text.includes('fire') || text.includes('stick')) return '📺';
  if (text.includes('tumbler') || text.includes('yeti') || text.includes('water')) return '🥤';
  if (text.includes('echo') || text.includes('speaker') || text.includes('smart')) return '🎙️';
  if (text.includes('headphone') || text.includes('earbud') || text.includes('audio') || text.includes('sound')) return '🎧';
  return '📦';
}

function getEventConfig(eventType) {
  switch (eventType) {
    case 'page_view':
      return {
        label: 'PAGE VIEW',
        iconClass: 'icon-pv',
        iconSymbol: '🌐',
        color: 'var(--cf-blue)',
        badgeBg: '#eff6ff',
        badgeBorder: '#bfdbfe'
      };
    case 'click':
      return {
        label: 'CLICK',
        iconClass: 'icon-clk',
        iconSymbol: '🖱️',
        color: '#b45309',
        badgeBg: '#fffbeb',
        badgeBorder: '#fde68a'
      };
    case 'add_to_cart':
      return {
        label: 'ADD TO CART',
        iconClass: 'icon-cart',
        iconSymbol: '🛒',
        color: '#059669',
        badgeBg: '#ecfdf5',
        badgeBorder: '#a7f3d0'
      };
    case 'product_favorite':
      return {
        label: 'SAVED TO WISHLIST',
        iconClass: 'icon-fav',
        iconSymbol: '❤️',
        color: '#e11d48',
        badgeBg: '#fff1f2',
        badgeBorder: '#fecdd3'
      };
    case 'product_unfavorite':
      return {
        label: 'REMOVED FROM WISHLIST',
        iconClass: 'icon-unfav',
        iconSymbol: '💔',
        color: '#64748b',
        badgeBg: '#f1f5f9',
        badgeBorder: '#e2e8f0'
      };
    case 'product_view':
      return {
        label: 'PRODUCT VIEW',
        iconClass: 'icon-pv',
        iconSymbol: '🔍',
        color: '#7c3aed',
        badgeBg: '#f5f3ff',
        badgeBorder: '#ddd6fe'
      };
    default:
      return {
        label: (eventType || 'EVENT').toUpperCase(),
        iconClass: 'icon-pv',
        iconSymbol: '⚡',
        color: 'var(--text-secondary)',
        badgeBg: '#f8fafc',
        badgeBorder: '#e2e8f0'
      };
  }
}

/**
 * Humanizes raw technical events into clear, high-level business milestones for an admin.
 * Eliminates duplicate consecutive page/product views, hides developer tags, and produces
 * an easy-to-read chronological story of the customer.
 */
function buildSimplifiedJourney(rawEvents = []) {
  const steps = [];
  let i = 0;

  while (i < rawEvents.length) {
    const e = rawEvents[i];
    const next = rawEvents[i + 1];

    // 1. Cart Addition (high priority milestone)
    if (e.eventType === 'add_to_cart' || (e.eventType === 'click' && (e.elementText && e.elementText.toLowerCase().includes('add to cart')))) {
      const prodName = e.productName || (next && next.productName) || 'Product';
      const category = e.productCategory || (next && next.productCategory) || '';
      const priceMatch = (e.elementText && e.elementText.match(/\$[0-9.]+/)) ? e.elementText.match(/\$[0-9.]+/)[0] : '';
      steps.push({
        id: e._id || `step-${i}`,
        type: 'add_to_cart',
        icon: '🛒',
        color: '#059669',
        badgeBg: '#ecfdf5',
        badgeBorder: '#10b981',
        title: `Added "${prodName}" to Cart`,
        subtitle: priceMatch ? `Price: ${priceMatch} • Added from Product Page` : 'Added to shopping cart',
        productName: prodName,
        productCategory: category,
        timestamp: e.timestamp,
        elapsedSeconds: e.elapsedSeconds,
        isHighlight: true
      });
      if (e.eventType === 'click' && next && next.eventType === 'add_to_cart') i++;
      i++;
      continue;
    }

    // 2. Wishlist / Favorite
    if (e.eventType === 'product_favorite' || (e.eventType === 'click' && next && next.eventType === 'product_favorite')) {
      const prodName = e.productName || (next && next.productName) || 'Product';
      const category = e.productCategory || (next && next.productCategory) || '';
      steps.push({
        id: e._id || `step-${i}`,
        type: 'product_favorite',
        icon: '❤️',
        color: '#e11d48',
        badgeBg: '#fff1f2',
        badgeBorder: '#fecdd3',
        title: `Saved "${prodName}" to Wishlist`,
        subtitle: category ? `Category: ${category}` : 'Saved to favorites',
        productName: prodName,
        productCategory: category,
        timestamp: e.timestamp,
        elapsedSeconds: e.elapsedSeconds
      });
      if (e.eventType === 'click' && next && next.eventType === 'product_favorite') i++;
      i++;
      continue;
    }

    // 3. Wishlist Removal
    if (e.eventType === 'product_unfavorite' || (e.eventType === 'click' && next && next.eventType === 'product_unfavorite')) {
      const prodName = e.productName || (next && next.productName) || 'Product';
      const category = e.productCategory || (next && next.productCategory) || '';
      steps.push({
        id: e._id || `step-${i}`,
        type: 'product_unfavorite',
        icon: '💔',
        color: '#64748b',
        badgeBg: '#f1f5f9',
        badgeBorder: '#e2e8f0',
        title: `Removed "${prodName}" from Wishlist`,
        subtitle: 'Unfavorited item',
        productName: prodName,
        productCategory: category,
        timestamp: e.timestamp,
        elapsedSeconds: e.elapsedSeconds
      });
      if (e.eventType === 'click' && next && next.eventType === 'product_unfavorite') i++;
      i++;
      continue;
    }

    // 4. Product View (Group consecutive duplicate page_view & product_view events)
    if (e.eventType === 'product_view' || (e.eventType === 'click' && e.pageUrl && e.pageUrl.includes('index') && next && next.eventType === 'product_view')) {
      const prodName = e.productName || (next && next.productName) || 'Product';
      const category = e.productCategory || (next && next.productCategory) || '';
      steps.push({
        id: e._id || `step-${i}`,
        type: 'product_view',
        icon: '🔍',
        color: '#7c3aed',
        badgeBg: '#f5f3ff',
        badgeBorder: '#ddd6fe',
        title: `Viewed Product: "${prodName}"`,
        subtitle: category ? `Category: ${category} • Product Details Page` : 'Product Details Page',
        productName: prodName,
        productCategory: category,
        timestamp: e.timestamp,
        elapsedSeconds: e.elapsedSeconds
      });
      // Skip redundant duplicate page_view / product_view for the exact same product in immediate succession
      while (
        i + 1 < rawEvents.length &&
        (rawEvents[i + 1].eventType === 'page_view' || rawEvents[i + 1].eventType === 'product_view') &&
        (rawEvents[i + 1].pageUrl?.includes('product') || rawEvents[i + 1].productName === prodName)
      ) {
        i++;
      }
      i++;
      continue;
    }

    // 5. Store Catalog Landing / Page View
    if (e.eventType === 'page_view') {
      const isCatalog = e.pageUrl?.includes('index') || e.pageUrl === '/' || !e.pageUrl?.includes('product');
      if (isCatalog) {
        steps.push({
          id: e._id || `step-${i}`,
          type: 'page_view',
          icon: '🌐',
          color: 'var(--cf-blue)',
          badgeBg: '#eff6ff',
          badgeBorder: '#bfdbfe',
          title: 'Browsed Store Catalog',
          subtitle: 'Visited Amazon Store Homepage & catalog showcase',
          pageUrl: e.pageUrl,
          timestamp: e.timestamp,
          elapsedSeconds: e.elapsedSeconds
        });
      }
      i++;
      continue;
    }

    // 6. Navigation Clicks
    if (e.eventType === 'click') {
      let label = (e.elementText || '').trim().replace(/\s+/g, ' ');
      // Filter out redundant empty clicks
      if (!label && !e.elementTag) {
        i++;
        continue;
      }

      let friendlyTitle = 'Clicked on page';
      let friendlySub = e.pageUrl || '';

      if (label.includes('Analytics')) {
        friendlyTitle = 'Clicked "Open User Analytics App"';
        friendlySub = 'Navigated to analytics dashboard';
      } else if (label.includes('View All')) {
        friendlyTitle = 'Expanded Full Catalog (View All 8 Items)';
        friendlySub = 'Browsed all product categories';
      } else if (label.toLowerCase().includes('cart')) {
        friendlyTitle = `Clicked Cart: "${label}"`;
      } else if (label) {
        friendlyTitle = `Clicked "${label.length > 40 ? label.slice(0, 40) + '...' : label}"`;
      }

      steps.push({
        id: e._id || `step-${i}`,
        type: 'click',
        icon: '👆',
        color: '#b45309',
        badgeBg: '#fffbeb',
        badgeBorder: '#fde68a',
        title: friendlyTitle,
        subtitle: friendlySub,
        timestamp: e.timestamp,
        elapsedSeconds: e.elapsedSeconds
      });
      i++;
      continue;
    }

    // Fallback for custom events
    steps.push({
      id: e._id || `step-${i}`,
      type: e.eventType,
      icon: '⚡',
      color: 'var(--text-secondary)',
      badgeBg: '#f8fafc',
      badgeBorder: '#e2e8f0',
      title: `${(e.eventType || 'action').replace(/_/g, ' ').toUpperCase()}`,
      subtitle: e.pageUrl || '',
      timestamp: e.timestamp,
      elapsedSeconds: e.elapsedSeconds
    });
    i++;
  }

  return steps;
}

export default function UserJourney({
  sessionId,
  events = [],
  loading,
  error
}) {
  const [viewMode, setViewMode] = useState('simplified'); // 'simplified' (default, admin-friendly) or 'raw'

  // Executive summary metrics for the selected session
  const summary = useMemo(() => {
    if (!events || events.length === 0) return null;

    const firstTime = new Date(events[0].timestamp).getTime();
    const lastTime = new Date(events[events.length - 1].timestamp).getTime();
    const durationSeconds = Math.max(0, Math.round((lastTime - firstTime) / 1000));

    const viewedProducts = new Set();
    const cartedProducts = new Set();
    const netFavorites = new Set();
    const pages = new Set();

    events.forEach(e => {
      if (e.pageUrl) pages.add(e.pageUrl);
      if (e.productName) {
        if (e.eventType === 'product_view' || e.eventType === 'click') {
          viewedProducts.add(e.productName);
        }
        if (e.eventType === 'add_to_cart') {
          cartedProducts.add(e.productName);
        }
        if (e.eventType === 'product_favorite') {
          netFavorites.add(e.productName);
        }
        if (e.eventType === 'product_unfavorite') {
          netFavorites.delete(e.productName);
        }
      }
    });

    return {
      durationStr: formatDuration(durationSeconds),
      productsExplored: Array.from(viewedProducts),
      cartItems: Array.from(cartedProducts),
      wishlistItems: Array.from(netFavorites),
      pagesCount: pages.size
    };
  }, [events]);

  const simplifiedSteps = useMemo(() => buildSimplifiedJourney(events), [events]);

  if (!sessionId) {
    return (
      <div className="card-panel" style={{ minHeight: '440px' }}>
        <div className="card-header-bar">
          <div className="card-header-title">
            <span>🛤️</span>
            <span>Visitor Journey</span>
          </div>
        </div>
        <div className="empty-state-card">
          <div className="empty-state-icon">👈</div>
          <div className="empty-state-heading">No Session Selected</div>
          <div className="empty-state-text">
            Select a session from the Recorded Sessions table on the left to inspect its real chronological journey.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-panel">
      {/* Right Panel Header */}
      <div className="card-header-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="card-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>🛤️</span>
            <span>Visitor Journey:</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--cf-blue)',
                background: 'var(--cf-blue-light)',
                padding: '3px 8px',
                borderRadius: '6px',
                border: '1px solid #bfdbfe'
              }}
            >
              {sessionId}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {viewMode === 'simplified'
              ? `Simplified customer journey (${simplifiedSteps.length} milestones from ${events.length} events)`
              : `Raw technical telemetry stream (${events.length} recorded events)`}
          </div>
        </div>

        {/* View Mode Toggle: Simplified Story vs Raw Telemetry */}
        <div
          style={{
            display: 'inline-flex',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}
        >
          <button
            onClick={() => setViewMode('simplified')}
            style={{
              border: 'none',
              background: viewMode === 'simplified' ? '#ffffff' : 'transparent',
              color: viewMode === 'simplified' ? 'var(--cf-blue)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '11.5px',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: viewMode === 'simplified' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Clean, easy-to-read customer journey without duplicate noise"
          >
            <span>👤</span>
            <span>Simplified Story</span>
          </button>
          <button
            onClick={() => setViewMode('raw')}
            style={{
              border: 'none',
              background: viewMode === 'raw' ? '#ffffff' : 'transparent',
              color: viewMode === 'raw' ? 'var(--cf-blue)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '11.5px',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: viewMode === 'raw' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="View all raw technical events, coordinates, and HTML tags"
          >
            <span>⚙️</span>
            <span>All Telemetry</span>
          </button>
        </div>
      </div>

      {/* Executive Session Summary Banner (Admin Snapshot) */}
      {summary && !loading && events.length > 0 && (
        <div
          style={{
            margin: '16px 20px 8px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              ⏱️ Duration
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {summary.durationStr}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              🛍️ Products Explored
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--cf-blue)', marginTop: '2px' }}>
              {summary.productsExplored.length} products
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              🛒 Cart Additions
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: summary.cartItems.length > 0 ? '#059669' : 'var(--text-muted)',
                marginTop: '2px'
              }}
            >
              {summary.cartItems.length > 0 ? `${summary.cartItems.length} item` : 'None'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              ❤️ In Wishlist
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#e11d48', marginTop: '2px' }}>
              {summary.wishlistItems.length} saved
            </div>
          </div>
        </div>
      )}

      {/* Timeline Stream */}
      {loading ? (
        <div style={{ padding: '28px' }}>
          <div style={{ height: '50px', background: '#f1f5f9', borderRadius: '10px', marginBottom: '12px' }}></div>
          <div style={{ height: '50px', background: '#f1f5f9', borderRadius: '10px', marginBottom: '12px' }}></div>
          <div style={{ height: '50px', background: '#f1f5f9', borderRadius: '10px' }}></div>
        </div>
      ) : error ? (
        <div className="empty-state-card">
          <div className="empty-state-icon" style={{ color: 'var(--cf-rose)' }}>⚠️</div>
          <div className="empty-state-heading">Error Loading Events</div>
          <div className="empty-state-text">{error}</div>
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state-card">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-heading">No Recorded Events</div>
          <div className="empty-state-text">This session has no recorded event data.</div>
        </div>
      ) : viewMode === 'simplified' ? (
        /* SIMPLIFIED ADMIN JOURNEY */
        <div className="journey-timeline-body" id="journey-timeline-container">
          {simplifiedSteps.map((step, idx) => {
            const isCart = step.type === 'add_to_cart';
            return (
              <div
                className="journey-step-item"
                key={step.id || idx}
                id={`journey-step-${idx + 1}`}
                style={{ paddingBottom: '16px' }}
              >
                {/* Step Marker */}
                <div
                  className="journey-step-icon"
                  style={{
                    background: step.badgeBg,
                    border: `2px solid ${step.badgeBorder}`,
                    fontSize: '17px',
                    boxShadow: isCart ? '0 0 0 3px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                  title={`Step ${idx + 1}: ${step.title}`}
                >
                  {step.icon}
                </div>

                {/* Step Content Card */}
                <div
                  className="journey-step-box"
                  style={{
                    background: isCart ? '#f0fdf4' : '#ffffff',
                    border: isCart ? '2px solid #86efac' : '1px solid var(--border-card)',
                    boxShadow: isCart ? '0 4px 12px rgba(16, 185, 129, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)'
                  }}
                >
                  <div className="step-header-meta">
                    <span
                      className="step-type-title"
                      style={{
                        color: step.color,
                        background: step.badgeBg,
                        border: `1px solid ${step.badgeBorder}`,
                        padding: '2px 9px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      Step {idx + 1}
                    </span>
                    <span className="step-time-text">
                      {formatTimestamp(step.timestamp)}
                      {step.elapsedSeconds !== undefined && (
                        <span style={{ marginLeft: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          (+{step.elapsedSeconds}s)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Primary Action Title */}
                  <div style={{ marginTop: '6px', fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {step.title}
                  </div>

                  {/* Subtitle / Details */}
                  {step.subtitle && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                      {step.subtitle}
                    </div>
                  )}

                  {/* Product Badge if associated */}
                  {step.productName && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {getProductEmoji(step.productName, step.productCategory)} {step.productName}
                      </span>
                      {step.productCategory && (
                        <span
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 600
                          }}
                        >
                          {step.productCategory}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* RAW TECHNICAL TELEMETRY STREAM (ALL 40 EVENTS FOR AUDITING) */
        <div className="journey-timeline-body" id="journey-timeline-container">
          {events.map((event, idx) => {
            const config = getEventConfig(event.eventType);
            const isClick = event.eventType === 'click';

            return (
              <div className="journey-step-item" key={event._id || idx} id={`journey-step-${idx + 1}`}>
                {/* Step Marker */}
                <div className={`journey-step-icon ${config.iconClass}`} title={`Step ${idx + 1}: ${event.eventType}`}>
                  {config.iconSymbol}
                </div>

                {/* Step Content Card */}
                <div className="journey-step-box">
                  <div className="step-header-meta">
                    <span
                      className="step-type-title"
                      style={{
                        color: config.color,
                        background: config.badgeBg,
                        border: `1px solid ${config.badgeBorder}`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}
                    >
                      Step {idx + 1}: {config.label}
                    </span>
                    <span className="step-time-text">
                      {formatTimestamp(event.timestamp)}
                      {event.elapsedSeconds !== undefined && (
                        <span style={{ marginLeft: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          (+{event.elapsedSeconds}s)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Page Title & URL */}
                  <div className="step-page-path">
                    {event.pageTitle && (
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginRight: '6px' }}>
                        {event.pageTitle} •
                      </span>
                    )}
                    <span>📍 {event.pageUrl}</span>
                  </div>

                  {/* Product Metadata Badge if attached to event */}
                  {event.productName && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {getProductEmoji(event.productName, event.productCategory)} {event.productName}
                      </span>
                      {event.productId && (
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '11px' }}>
                          ({event.productId})
                        </span>
                      )}
                      {event.productCategory && (
                        <span
                          style={{
                            background: '#e0f2fe',
                            color: '#0369a1',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontSize: '10.5px',
                            fontWeight: 600
                          }}
                        >
                          {event.productCategory}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Click Specific Coordinates & Element Info */}
                  {isClick && (
                    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                      <span className="click-coord-badge" title="Exact document coordinates">
                        🎯 (x: {event.x}, y: {event.y})
                      </span>

                      {event.elementTag && (
                        <span
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #e2e8f0',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-primary)'
                          }}
                        >
                          &lt;{event.elementTag}&gt;
                          {event.elementText ? ` "${event.elementText}"` : ''}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
