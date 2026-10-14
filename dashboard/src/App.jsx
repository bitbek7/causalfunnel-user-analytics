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

  // Show transient toast
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load real telemetry sessions & backend health
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

      // Auto-select first session if none is selected
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

  // Initial fetch and 6s polling for live activity
  useEffect(() => {
    loadInitialData();

    const interval = setInterval(() => {
      loadInitialData(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [loadInitialData]);

  // Load events when a session is selected
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

  // Seed sample data action
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
            top: '80px',
            right: '28px',
            zIndex: 9999,
            background: '#ffffff',
            border: '1px solid #bfdbfe',
            color: 'var(--text-primary)',
            padding: '12px 22px',
            borderRadius: '9999px',
            boxShadow: '0 10px 25px rgba(37, 99, 235, 0.15)',
            fontSize: '13.5px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Floating Pill Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLive={isLive}
        isRefreshing={isRefreshing}
        onRefresh={() => loadInitialData(false)}
        onSeedDemo={handleSeedDemo}
        isSeeding={isSeeding}
      />

      {/* Main Page Content */}
      <main className="page-container" style={{ flexGrow: 1 }}>
        {/* VIEW 1: Sessions & Visitor Journeys */}
        {activeTab === 'sessions' && (
          <div>
            {/* Page Heading & Subtitle */}
            <div className="section-hero">
              <h1>User <span className="brand-accent">Analytics</span></h1>
              <p>Understand how visitors interact with your website.</p>
            </div>

            {/* 4 Compact Metric Cards */}
            <OverviewMetrics sessions={sessions} />

            {/* Two Main Panels */}
            <div className="dual-panel-layout">
              {/* Left Panel: Recorded Sessions */}
              <SessionsView
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={(id) => setSelectedSessionId(id)}
                loading={loadingSessions}
              />

              {/* Right Panel: Visitor Journey */}
              <UserJourney
                sessionId={selectedSessionId}
                events={sessionEvents}
                loading={loadingEvents}
                error={eventsError}
              />
            </div>
          </div>
        )}

        {/* VIEW 2: Click Heatmap Explorer */}
        {activeTab === 'heatmap' && (
          <HeatmapView />
        )}
      </main>

      {/* Clean Footer */}
      <footer
        style={{
          padding: '24px 28px',
          textAlign: 'center',
          borderTop: '1px solid var(--border-card)',
          fontSize: '12.5px',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.6)'
        }}
      >
        <span>CausalFunnel Analytics Platform • Real-Time User Behavior Engine • Node.js, MongoDB & React</span>
      </footer>
    </div>
  );
}
