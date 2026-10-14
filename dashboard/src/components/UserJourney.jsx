import React from 'react';

function formatTimestamp(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

function getEventConfig(eventType) {
  switch (eventType) {
    case 'page_view':
      return {
        label: 'PAGE VIEW',
        iconClass: 'icon-pv',
        iconSymbol: '👁️',
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
        label: 'FAVORITE',
        iconClass: 'icon-fav',
        iconSymbol: '❤️',
        color: '#e11d48',
        badgeBg: '#fff1f2',
        badgeBorder: '#fecdd3'
      };
    case 'product_unfavorite':
      return {
        label: 'UNFAVORITE',
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

export default function UserJourney({
  sessionId,
  events = [],
  loading,
  error
}) {
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
      <div className="card-header-bar">
        <div>
          <div className="card-header-title">
            <span>🛤️</span>
            <span>Visitor Journey:</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12.5px',
                color: 'var(--cf-blue)',
                background: 'var(--cf-blue-light)',
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid #bfdbfe'
              }}
            >
              {sessionId}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Chronological sequence of visitor actions ({events.length} events)
          </div>
        </div>
      </div>

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
      ) : (
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
                        🎧 {event.productName}
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
