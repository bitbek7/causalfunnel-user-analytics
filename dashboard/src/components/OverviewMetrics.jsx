import React from 'react';

export default function OverviewMetrics({ sessions = [] }) {
  // Aggregate real telemetry metrics from backend sessions response
  const recordedSessions = sessions.length;
  const totalEvents = sessions.reduce((acc, s) => acc + (s.totalEvents || 0), 0);
  const pageViews = sessions.reduce((acc, s) => acc + (s.pageViews || 0), 0);
  const clicks = sessions.reduce((acc, s) => acc + (s.clicks || 0), 0);

  return (
    <div className="metrics-row" aria-label="System Metrics Overview">
      {/* 1. Recorded Sessions */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-blue">
          👥
        </div>
        <div className="metric-info">
          <span className="metric-label">Recorded Sessions</span>
          <span className="metric-number" id="metric-recorded-sessions">{recordedSessions}</span>
          <span className="metric-caption">Distinct browser visits</span>
        </div>
      </div>

      {/* 2. Total Events */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-purple">
          ⚡
        </div>
        <div className="metric-info">
          <span className="metric-label">Total Events</span>
          <span className="metric-number" id="metric-total-events">{totalEvents}</span>
          <span className="metric-caption">Signals ingested</span>
        </div>
      </div>

      {/* 3. Page Views */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-cyan">
          👁️
        </div>
        <div className="metric-info">
          <span className="metric-label">Page Views</span>
          <span className="metric-number" id="metric-page-views">{pageViews}</span>
          <span className="metric-caption">URL navigations loaded</span>
        </div>
      </div>

      {/* 4. Clicks */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-amber">
          🖱️
        </div>
        <div className="metric-info">
          <span className="metric-label">Clicks</span>
          <span className="metric-number" id="metric-clicks">{clicks}</span>
          <span className="metric-caption">Interaction coordinates</span>
        </div>
      </div>
    </div>
  );
}
