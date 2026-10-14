import React from 'react';

export default function Navbar({
  activeTab,
  setActiveTab,
  isLive,
  isRefreshing,
  onRefresh
}) {
  return (
    <div className="nav-wrapper">
      <header className="nav-pill-container">
        {/* Left: CausalFunnel Brand & Subtitle */}
        <div className="brand-section">
          {/* CausalFunnel Logo Mark (Geometric Funnel SVG with Cyan-to-Indigo Gradient) */}
          <svg className="brand-icon-svg" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="cfLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <path
              d="M6 10C6 8.89543 6.89543 8 8 8H32C33.1046 8 34 8.89543 34 10C34 10.6383 33.6961 11.2369 33.1818 11.6146L22.5 19.5V29C22.5 29.7956 22.0253 30.5147 21.2882 30.8351L18.7882 31.922C17.7554 32.3711 16.5 31.6133 16.5 30.4869V19.5L6.81824 11.6146C6.30388 11.2369 6 10.6383 6 10Z"
              fill="url(#cfLogoGrad)"
            />
            <circle cx="28" cy="12" r="3" fill="#38bdf8" />
          </svg>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-name">CausalFunnel</span>
              <span className="brand-subtitle-badge">SESSION ANALYTICS</span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <nav className="nav-links-pill" aria-label="Main Navigation">
          <button
            id="tab-sessions"
            className={`nav-tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            <span>📋</span>
            <span>Sessions & Journeys</span>
          </button>

          <button
            id="tab-heatmap"
            className={`nav-tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <span>🗺️</span>
            <span>Click Heatmap</span>
          </button>
        </nav>

        {/* Right: API Connection Status & Refresh Button */}
        <div className="nav-actions">
          {/* API Connection Status reflecting actual backend health */}
          <div
            id="api-status-badge"
            className={`api-status-pill ${isLive ? 'api-status-online' : 'api-status-offline'}`}
            title={isLive ? 'Backend Express & MongoDB Connected' : 'Cannot reach backend API'}
          >
            <span className={isLive ? 'status-dot-green' : ''}></span>
            <span>{isLive ? 'API CONNECTED' : 'OFFLINE'}</span>
          </div>

          {/* Refresh Button */}
          <button
            id="btn-refresh-data"
            className="btn-cf-primary"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh analytics data from database"
          >
            <span style={{ display: 'inline-block', transform: isRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s ease' }}>
              🔄
            </span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>
    </div>
  );
}
