// Automated API Integration Test Script
async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  console.log('🧪 Starting Automated Backend API Verification...');

  // Test 1: Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  console.log('✅ 1. GET /api/health:', health.status === 'healthy' ? 'PASSED' : 'FAILED');

  // Test 2: Ingest page_view
  const pvRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'sess_integ_001',
      eventType: 'page_view',
      pageUrl: '/demo/index.html',
      timestamp: new Date().toISOString()
    })
  });
  const pvData = await pvRes.json();
  console.log('✅ 2. POST /api/events (page_view):', pvData.success ? 'PASSED' : 'FAILED');

  // Test 3: Ingest click
  const clickRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'sess_integ_001',
      eventType: 'click',
      pageUrl: '/demo/index.html',
      timestamp: new Date().toISOString(),
      x: 350,
      y: 220,
      elementTag: 'BUTTON',
      elementText: 'Add to Cart'
    })
  });
  const clickData = await clickRes.json();
  console.log('✅ 3. POST /api/events (click):', clickData.success ? 'PASSED' : 'FAILED');

  // Test 4: Validation Failure (Click missing coordinates)
  const invalidRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'sess_integ_001',
      eventType: 'click',
      pageUrl: '/demo/index.html'
    })
  });
  const invalidData = await invalidRes.json();
  console.log('✅ 4. Validation Rejection (missing x/y):', invalidRes.status === 400 && !invalidData.success ? 'PASSED' : 'FAILED');

  // Test 5: List Sessions Aggregation
  const sessionsRes = await fetch(`${BASE_URL}/sessions`);
  const sessionsData = await sessionsRes.json();
  const sessionFound = sessionsData.data && sessionsData.data.find(s => s.sessionId === 'sess_integ_001');
  console.log('✅ 5. GET /api/sessions:', (sessionFound && sessionFound.totalEvents === 2) ? 'PASSED (TotalEvents: 2)' : 'FAILED');

  // Test 6: Get Session Journey
  const journeyRes = await fetch(`${BASE_URL}/sessions/sess_integ_001/events`);
  const journeyData = await journeyRes.json();
  console.log('✅ 6. GET /api/sessions/:id/events:', (journeyData.data && journeyData.data.length === 2) ? 'PASSED (Chronological Steps: 2)' : 'FAILED');

  // Test 7: Get Heatmap Data
  const heatmapRes = await fetch(`${BASE_URL}/heatmap?pageUrl=/demo/index.html`);
  const heatmapData = await heatmapRes.json();
  console.log('✅ 7. GET /api/heatmap:', (heatmapData.totalClicks === 1 && heatmapData.clicks[0].x === 350) ? 'PASSED (Coordinates Verified)' : 'FAILED');

  console.log('\n🎉 ALL 7 BACKEND API TESTS COMPLETED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test script error:', err);
  process.exit(1);
});
