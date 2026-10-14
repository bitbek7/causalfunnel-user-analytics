// Automated API Integration Test Script
async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  const testSessionId = 'sess_test_' + Date.now();
  const testPageUrl = '/test-page-' + Date.now();

  console.log(`🧪 Starting Automated Backend API Verification (Session: ${testSessionId})...`);

  // Test 1: Health Check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const health = await healthRes.json();
  const t1Passed = health.status === 'healthy';
  console.log(`[${t1Passed ? 'PASS' : 'FAIL'}] 1. GET /api/health -> status: ${health.status}`);

  // Test 2: Ingest page_view
  const pvRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'page_view',
      pageUrl: testPageUrl,
      timestamp: new Date().toISOString()
    })
  });
  const pvData = await pvRes.json();
  const t2Passed = pvRes.status === 201 && pvData.success === true;
  console.log(`[${t2Passed ? 'PASS' : 'FAIL'}] 2. POST /api/events (page_view) -> status: ${pvRes.status}`);

  // Test 3: Ingest click with x, y
  const clickRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'click',
      pageUrl: testPageUrl,
      timestamp: new Date().toISOString(),
      x: 420,
      y: 180,
      elementTag: 'BUTTON',
      elementText: 'Buy Now'
    })
  });
  const clickData = await clickRes.json();
  const t3Passed = clickRes.status === 201 && clickData.success === true && clickData.data.x === 420;
  console.log(`[${t3Passed ? 'PASS' : 'FAIL'}] 3. POST /api/events (click) -> status: ${clickRes.status}, x: ${clickData.data?.x}, y: ${clickData.data?.y}`);

  // Test 4: Validation Rejection (Click missing coordinates)
  const invalidRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'click',
      pageUrl: testPageUrl
    })
  });
  const invalidData = await invalidRes.json();
  const t4Passed = invalidRes.status === 400 && invalidData.success === false;
  console.log(`[${t4Passed ? 'PASS' : 'FAIL'}] 4. POST /api/events (invalid click without coordinates) -> rejected with 400`);

  // Test 5: List Sessions Aggregation
  const sessionsRes = await fetch(`${BASE_URL}/sessions`);
  const sessionsData = await sessionsRes.json();
  const sessionFound = sessionsData.data && sessionsData.data.find(s => s.sessionId === testSessionId);
  const t5Passed = sessionFound && sessionFound.totalEvents === 2 && sessionFound.pageViews === 1 && sessionFound.clicks === 1;
  console.log(`[${t5Passed ? 'PASS' : 'FAIL'}] 5. GET /api/sessions -> session aggregated: totalEvents=${sessionFound?.totalEvents}, pv=${sessionFound?.pageViews}, clicks=${sessionFound?.clicks}`);

  // Test 6: Get Session Journey Chronological Ordering
  const journeyRes = await fetch(`${BASE_URL}/sessions/${testSessionId}/events`);
  const journeyData = await journeyRes.json();
  const t6Passed = journeyData.data && journeyData.data.length === 2 && journeyData.data[0].eventType === 'page_view' && journeyData.data[1].eventType === 'click';
  console.log(`[${t6Passed ? 'PASS' : 'FAIL'}] 6. GET /api/sessions/:id/events -> returned ${journeyData.data?.length} events in chronological order`);

  // Test 7: Get Heatmap Data
  const heatmapRes = await fetch(`${BASE_URL}/heatmap?pageUrl=${encodeURIComponent(testPageUrl)}`);
  const heatmapData = await heatmapRes.json();
  const t7Passed = heatmapData.totalClicks === 1 && heatmapData.clicks[0].x === 420 && heatmapData.clicks[0].y === 180;
  console.log(`[${t7Passed ? 'PASS' : 'FAIL'}] 7. GET /api/heatmap -> returned ${heatmapData.totalClicks} clicks with coordinates (x: ${heatmapData.clicks?.[0]?.x}, y: ${heatmapData.clicks?.[0]?.y})`);

  const allPassed = t1Passed && t2Passed && t3Passed && t4Passed && t5Passed && t6Passed && t7Passed;

  if (allPassed) {
    console.log('\n🎉 ALL 7 MANDATORY BACKEND API VERIFICATIONS PASSED 100%!');
  } else {
    console.error('\n❌ SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
