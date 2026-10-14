import React, { useState } from 'react';

function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch (e) {
    return isoString;
  }
}

export default function SessionsView({
  sessions = [],
  selectedSessionId,
  onSelectSession,
  loading
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.entryPage && s.entryPage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="card-panel">
      {/* Left Panel Header */}
      <div className="card-header-bar">
        <div className="card-header-title">
          <span>📋</span>
          <span>Recorded Sessions</span>
          <span className="badge-event-count" id="badge-sessions-count">
            {filteredSessions.length} sessions
          </span>
        </div>

        <div>
          <input
            id="input-session-search"
            type="text"
            className="search-field-pill"
            placeholder="Search session ID or page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table Area */}
      <div className="sessions-table-wrapper">
        {loading ? (
          <div style={{ padding: '28px' }}>
            <div style={{ height: '38px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '10px' }}></div>
            <div style={{ height: '38px', background: '#f1f5f9', borderRadius: '8px', marginBottom: '10px' }}></div>
            <div style={{ height: '38px', background: '#f1f5f9', borderRadius: '8px' }}></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-state-icon">🔍</div>
            <div className="empty-state-heading">No Sessions Found</div>
            <div className="empty-state-text">
              {searchTerm
                ? 'No recorded sessions matched your search query.'
                : 'No browsing sessions recorded yet. Open the demo storefront or click "Seed Sample Data"!'}
            </div>
          </div>
        ) : (
          <table className="clean-table" id="sessions-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Total Events</th>
                <th>Page Views</th>
                <th>Clicks</th>
                <th>Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const isSelected = session.sessionId === selectedSessionId;
                return (
                  <tr
                    key={session.sessionId}
                    className={isSelected ? 'row-selected' : ''}
                    onClick={() => onSelectSession(session.sessionId)}
                    id={`session-row-${session.sessionId}`}
                    title="Click to view chronological visitor journey"
                  >
                    <td>
                      <div className="session-id-pill">
                        {session.sessionId.length > 20
                          ? session.sessionId.substring(0, 18) + '...'
                          : session.sessionId}
                      </div>
                    </td>
                    <td>
                      <span className="badge-event-count">
                        {session.totalEvents} events
                      </span>
                    </td>
                    <td>
                      <span className="pill-view-type pill-pv">
                        👁️ {session.pageViews}
                      </span>
                    </td>
                    <td>
                      <span className="pill-view-type pill-clk">
                        🖱️ {session.clicks}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {formatTime(session.lastActiveAt)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
