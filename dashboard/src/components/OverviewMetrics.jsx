import React from 'react';

export default function OverviewMetrics({ sessions = [] }) {
  const totalSessions = sessions.length;
  const totalEvents = sessions.reduce((acc, s) => acc + (s.totalEvents || 0), 0);
  const totalPageViews = sessions.reduce((acc, s) => acc + (s.pageViews || 0), 0);
  const totalClicks = sessions.reduce((acc, s) => acc + (s.clicks || 0), 0);
  const clickRatio = totalPageViews > 0 ? (totalClicks / totalPageViews).toFixed(2) : '0.00';

  return (
    <section className="metrics-grid" aria-label="System Overview Metrics">
      <div className="glass-panel metric-card">
        <div className="metric-title">
          <span>Active Sessions</span>
          <span>👥</span>
        </div>
        <div className="metric-value" id="metric-total-sessions">{totalSessions}</div>
        <div className="metric-sub">
          <span style={{ color: 'var(--emerald)' }}>●</span> Distinct browser tabs
        </div>
      </div>

      <div className="glass-panel metric-card">
        <div className="metric-title">
          <span>Total Recorded Events</span>
          <span>⚡</span>
        </div>
        <div className="metric-value" id="metric-total-events" style={{ color: '#a5b4fc' }}>
          {totalEvents}
        </div>
        <div className="metric-sub">
          <span>Telemetry signals captured</span>
        </div>
      </div>

      <div className="glass-panel metric-card">
        <div className="metric-title">
          <span>Page Views</span>
          <span>👁️</span>
        </div>
        <div className="metric-value" id="metric-page-views" style={{ color: 'var(--cyan)' }}>
          {totalPageViews}
        </div>
        <div className="metric-sub">
          <span>Screen navigation loads</span>
        </div>
      </div>

      <div className="glass-panel metric-card">
        <div className="metric-title">
          <span>Total Clicks</span>
          <span>🖱️</span>
        </div>
        <div className="metric-value" id="metric-clicks" style={{ color: 'var(--amber)' }}>
          {totalClicks}
        </div>
        <div className="metric-sub">
          <span>Interaction points with (x, y)</span>
        </div>
      </div>

      <div className="glass-panel metric-card">
        <div className="metric-title">
          <span>Click / View Ratio</span>
          <span>📈</span>
        </div>
        <div className="metric-value" id="metric-ratio" style={{ color: 'var(--emerald)' }}>
          {clickRatio}
        </div>
        <div className="metric-sub">
          <span>Avg clicks per page view</span>
        </div>
      </div>
    </section>
  );
}
