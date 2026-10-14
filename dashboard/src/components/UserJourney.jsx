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
            const isClick = event.eventType === 'click';
            const iconClass = isClick ? 'icon-clk' : 'icon-pv';
            const iconSymbol = isClick ? '🖱️' : '👁️';

            return (
              <div className="journey-step-item" key={event._id || idx} id={`journey-step-${idx + 1}`}>
                {/* Step Marker */}
                <div className={`journey-step-icon ${iconClass}`} title={`Step ${idx + 1}: ${event.eventType}`}>
                  {iconSymbol}
                </div>

                {/* Step Content Card */}
                <div className="journey-step-box">
                  <div className="step-header-meta">
                    <span
                      className="step-type-title"
                      style={{ color: isClick ? '#b45309' : 'var(--cf-blue)' }}
                    >
                      Step {idx + 1}: {event.eventType === 'page_view' ? 'PAGE VIEW' : 'CLICK'}
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

                  <div className="step-page-path">
                    📍 {event.pageUrl}
                  </div>

                  {/* Click Specific Coordinates & Target */}
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
