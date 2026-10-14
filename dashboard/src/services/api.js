const API_BASE = 'http://localhost:5000/api';

/**
 * Centralized API client for communicating with CausalFunnel Analytics Engine
 */

export async function fetchSessions() {
  const res = await fetch(`${API_BASE}/sessions`);
  if (!res.ok) throw new Error(`Failed to fetch sessions (${res.status})`);
  return res.json();
}

export async function fetchSessionEvents(sessionId) {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}/events`);
  if (!res.ok) throw new Error(`Failed to fetch events for session ${sessionId} (${res.status})`);
  return res.json();
}

export async function fetchHeatmap(pageUrl) {
  const res = await fetch(`${API_BASE}/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`);
  if (!res.ok) throw new Error(`Failed to fetch heatmap for ${pageUrl} (${res.status})`);
  return res.json();
}

export async function fetchTrackedPages() {
  const res = await fetch(`${API_BASE}/pages`);
  if (!res.ok) throw new Error(`Failed to fetch tracked pages (${res.status})`);
  return res.json();
}

export async function fetchProductRankings() {
  const res = await fetch(`${API_BASE}/products/rankings`);
  if (!res.ok) throw new Error(`Failed to fetch product rankings (${res.status})`);
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed (${res.status})`);
  return res.json();
}

export async function seedDemoData() {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`Seed failed (${res.status})`);
  return res.json();
}

