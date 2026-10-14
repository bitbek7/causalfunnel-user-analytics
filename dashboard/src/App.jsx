import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import OverviewMetrics from './components/OverviewMetrics';
import SessionsView from './components/SessionsView';
import UserJourney from './components/UserJourney';
import HeatmapView from './components/HeatmapView';
import { fetchSessions, fetchSessionEvents, fetchHealth, seedDemoData } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('sessions'); // 'sessions' | 'heatmap'
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionEvents, setSessionEvents] = useState([]);

  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  const [isLive, setIsLive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Show brief feedback toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load health and sessions
  const loadInitialData = useCallback(async (silent = false) => {
    if (!silent) setLoadingSessions(true);
    setIsRefreshing(true);

    try {
      const [healthRes, sessionsRes] = await Promise.all([
        fetchHealth().catch(() => ({ status: 'down' })),
        fetchSessions().catch(() => ({ data: [] }))
      ]);

      setIsLive(healthRes.status === 'healthy');

      const fetchedSessions = sessionsRes.data || [];
      setSessions(fetchedSessions);

      // Auto-select first session if none selected yet
      if (fetchedSessions.length > 0 && !selectedSessionId) {
        setSelectedSessionId(fetchedSessions[0].sessionId);
      }
    } catch (err) {
      console.error('Data refresh error:', err);
      setIsLive(false);
    } finally {
      setLoadingSessions(false);
      setIsRefreshing(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    loadInitialData();

    // Auto-poll every 6 seconds so incoming live events appear automatically
    const interval = setInterval(() => {
      loadInitialData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [loadInitialData]);

  // Load events when selectedSessionId changes
  useEffect(() => {
    if (!selectedSessionId) {
      setSessionEvents([]);
      return;
    }

    let isMounted = true;
    async function loadEvents() {
      setLoadingEvents(true);
      setEventsError(null);
      try {
        const res = await fetchSessionEvents(selectedSessionId);
        if (isMounted) {
          setSessionEvents(res.data || []);
        }
      } catch (err) {
        if (isMounted) setEventsError(err.message);
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    }

    loadEvents();
    return () => { isMounted = false; };
  }, [selectedSessionId]);

  // Handle seed demo data action
  const handleSeedDemo = async () => {
    setIsSeeding(true);
    try {
      const res = await seedDemoData();
      showToast(`🌱 Seeded ${res.eventsCount} demo events across ${res.sessionsCount} sessions!`);
      await loadInitialData(false);
    } catch (err) {
      showToast(`❌ Seeding failed: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '76px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            border: '1px solid var(--accent-primary)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={isLive}
        isRefreshing={isRefreshing}
        onRefresh={() => loadInitialData(false)}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
      />

      {/* Main Dashboard Content */}
      <main className="dashboard-container" style={{ flexGrow: 1 }}>
        {/* Top-Level Metrics Overview */}
        <OverviewMetrics sessions={sessions} />

        {/* Tab 1: Sessions & User Journeys */}
        {activeTab === 'sessions' && (
          <div className="sessions-layout">
            <SessionsView
              sessions={sessions}
              selectedSessionId={selectedSessionId}
              onSelectSession={(id) => setSelectedSessionId(id)}
              loading={loadingSessions}
            />

            <UserJourney
              sessionId={selectedSessionId}
              events={sessionEvents}
              loading={loadingEvents}
              error={eventsError}
            />
          </div>
        )}

        {/* Tab 2: Click Heatmap Explorer */}
        {activeTab === 'heatmap' && (
          <HeatmapView />
        )}
      </main>

      {/* Minimal Footer */}
      <footer
        style={{
          padding: '18px 28px',
          textAlign: 'center',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}
      >
        <span>CausalFunnel Analytics Engine • Full-Stack Assignment • Built with Node.js, Express, MongoDB & React</span>
      </footer>
    </div>
  );
}
