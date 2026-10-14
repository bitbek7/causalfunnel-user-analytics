import React, { useState } from 'react';

function formatTimestamp(isoString) {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
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
  const [sortBy, setSortBy] = useState('lastActiveAt');

  const filteredSessions = sessions.filter((s) =>
    s.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.entryPage && s.entryPage.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="glass-panel" style={{ overflow: 'hidden' }}>
      <div className="panel-header">
        <div className="panel-title">
          <span>📋</span>
          <span>Recorded Sessions</span>
          <span className="counter-badge" id="badge-sessions-count">{filteredSessions.length}</span>
        </div>

        <div>
          <input
            id="input-session-search"
            type="text"
            className="search-input"
            placeholder="Search by session ID or page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '24px' }}>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="state-box">
            <div className="state-icon">🔍</div>
            <div className="state-title">No Sessions Found</div>
            <div className="state-desc">
              {searchTerm
                ? 'No sessions matched your search criteria.'
                : 'No user sessions recorded yet. Open the demo storefront or click "Seed Sample Data" above!'}
            </div>
          </div>
        ) : (
          <table className="analytics-table" id="sessions-table">
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Total Events</th>
                <th>Breakdown</th>
                <th>Entry Page</th>
                <th>Duration</th>
                <th>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => {
                const isSelected = session.sessionId === selectedSessionId;
                return (
                  <tr
                    key={session.sessionId}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => onSelectSession(session.sessionId)}
                    id={`session-row-${session.sessionId}`}
                  >
                    <td>
                      <div className="session-code" title={session.sessionId}>
                        {session.sessionId.length > 20
                          ? session.sessionId.substring(0, 18) + '...'
                          : session.sessionId}
                      </div>
                    </td>
                    <td>
                      <span className="counter-badge" style={{ fontSize: '13px', padding: '3px 10px' }}>
                        {session.totalEvents} events
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span className="chip-pageview" title="Page views">
                          👁️ {session.pageViews}
                        </span>
                        <span className="chip-click" title="Clicks">
                          🖱️ {session.clicks}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#cbd5e1' }}>
                        {session.entryPage || '/'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {session.durationSeconds !== undefined ? `${session.durationSeconds}s` : '0s'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatTimestamp(session.lastActiveAt)}
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
