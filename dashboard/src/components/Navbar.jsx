import React from 'react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isLive,
  isRefreshing,
  onRefresh,
  onSeedDemo,
  isSeeding
}) {
  return (
    <header class="app-header">
      <div className="brand-wrapper">
        <div className="brand-logo-badge">⚡</div>
        <div>
          <div className="brand-name">CausalFunnel</div>
          <div className="brand-subtitle">Session & Heatmap Engine</div>
        </div>
      </div>

      <nav className="nav-tabs" aria-label="Dashboard Views">
        <button
          id="tab-sessions"
          className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
          <span>📋</span> Sessions & Journeys
        </button>
        <button
          id="tab-heatmap"
          className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
          onClick={() => setActiveTab('heatmap')}
        >
          <span>🗺️</span> Click Heatmap
        </button>
      </nav>

      <div className="header-actions">
        <div className="live-indicator" title="Connected to Express + MongoDB">
          <span className="pulsing-dot"></span>
          <span>{isLive ? 'API CONNECTED' : 'OFFLINE'}</span>
        </div>

        <button
          id="btn-seed-data"
          className="btn btn-secondary"
          onClick={onSeedDemo}
          disabled={isSeeding}
          title="Seed demo sessions and clicks for instant review"
          style={{ fontSize: '12px', padding: '6px 12px' }}
        >
          <span>{isSeeding ? '⏳ Seeding...' : '🌱 Seed Sample Data'}</span>
        </button>

        <button
          id="btn-refresh-data"
          className="btn btn-primary"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Fetch latest telemetry events"
          style={{ fontSize: '12px', padding: '6px 14px' }}
        >
          <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s' }}>🔄</span>
          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
