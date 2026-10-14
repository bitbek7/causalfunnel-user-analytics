import React from 'react';

function formatTime(isoString) {
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
      <div className="glass-panel" style={{ minHeight: '400px' }}>
        <div className="panel-header">
          <div className="panel-title">
            <span>🛤️</span>
            <span>User Journey Timeline</span>
          </div>
        </div>
        <div className="state-box">
          <div className="state-icon">👈</div>
          <div className="state-title">No Session Selected</div>
          <div className="state-desc">
            Click on any session in the table to inspect its chronological event journey and interactions.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div className="panel-header">
        <div>
          <div className="panel-title">
            <span>🛤️</span>
            <span>User Journey:</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: '#a5b4fc',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              {sessionId}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Chronological step-by-step visitor stream ({events.length} interactions)
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '24px' }}>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
          <div className="skeleton-row"></div>
        </div>
      ) : error ? (
        <div className="state-box">
          <div className="state-icon" style={{ color: 'var(--rose)' }}>⚠️</div>
          <div className="state-title">Error Loading Journey</div>
          <div className="state-desc">{error}</div>
        </div>
      ) : events.length === 0 ? (
        <div className="state-box">
          <div className="state-icon">📭</div>
          <div className="state-title">No Events in Session</div>
          <div className="state-desc">This session has no recorded events.</div>
        </div>
      ) : (
        <div className="journey-timeline" id="journey-timeline-container">
          {events.map((event, idx) => {
            const isClick = event.eventType === 'click';
            const markerClass = isClick ? 'marker-click' : 'marker-pageview';
            const markerIcon = isClick ? '🖱️' : '👁️';

            return (
              <div className="timeline-step" key={event._id || idx} id={`journey-step-${idx + 1}`}>
                <div className={`step-marker ${markerClass}`} title={`Step ${idx + 1}`}>
                  {markerIcon}
                </div>

                <div className="step-content">
                  <div className="step-meta">
                    <span
                      className="step-type"
                      style={{ color: isClick ? 'var(--amber)' : 'var(--cyan)' }}
                    >
                      Step {idx + 1}: {event.eventType.replace('_', ' ')}
                    </span>
                    <span className="step-time">
                      {formatTime(event.timestamp)}
                      {event.elapsedSeconds !== undefined && (
                        <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>
                          (+{event.elapsedSeconds}s)
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="step-url">
                    📍 {event.pageUrl}
                  </div>

                  {isClick && (
                    <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      <span className="click-coords-tag" title="Exact document coordinates">
                        🎯 (x: {event.x}, y: {event.y})
                      </span>

                      {event.elementTag && (
                        <span
                          style={{
                            background: 'rgba(255, 255, 255, 0.06)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontFamily: 'var(--font-mono)',
                            color: '#e2e8f0'
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
