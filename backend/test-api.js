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

  // Test 8: Add to Cart Event
  const cartRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'add_to_cart',
      pageUrl: testPageUrl,
      productId: 'prod_aura_pro',
      productName: 'Aura Pro Studio',
      productCategory: 'Studio Headphones',
      source: 'demo_store'
    })
  });
  const t8Passed = cartRes.status === 201;
  console.log(`[${t8Passed ? 'PASS' : 'FAIL'}] 8. POST /api/events (add_to_cart) -> status: ${cartRes.status}, product: prod_aura_pro`);

  // Test 9: Favorite Event
  const favRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: testSessionId,
      eventType: 'product_favorite',
      pageUrl: testPageUrl,
      productId: 'prod_aura_pro',
      productName: 'Aura Pro Studio',
      productCategory: 'Studio Headphones',
      source: 'demo_store'
    })
  });
  const t9Passed = favRes.status === 201;
  console.log(`[${t9Passed ? 'PASS' : 'FAIL'}] 9. POST /api/events (product_favorite) -> status: ${favRes.status}`);

  // Test 10: Product Rankings API
  const rankRes = await fetch(`${BASE_URL}/products/rankings`);
  const rankData = await rankRes.json();
  const t10Passed = rankRes.status === 200 &&
    rankData.success === true &&
    Array.isArray(rankData.rankings?.mostClicked) &&
    Array.isArray(rankData.rankings?.mostAddedToCart) &&
    Array.isArray(rankData.rankings?.mostFavorited);
  console.log(`[${t10Passed ? 'PASS' : 'FAIL'}] 10. GET /api/products/rankings -> status: ${rankRes.status}, returned rankings categories`);

  // Test 11: Product Conversion Funnel
  const funnel = rankData.funnel;
  const t11Passed = funnel &&
    typeof funnel.productViewSessions === 'number' &&
    typeof funnel.addToCartSessions === 'number' &&
    funnel.productViewSessions >= 1 &&
    funnel.addToCartSessions >= 1 &&
    funnel.conversionRate !== null &&
    typeof funnel.conversionRateFormatted === 'string';
  console.log(`[${t11Passed ? 'PASS' : 'FAIL'}] 11. Product Conversion Funnel -> View Sessions: ${funnel?.productViewSessions}, Cart Sessions: ${funnel?.addToCartSessions}, Rate: ${funnel?.conversionRateFormatted}`);

  // Test 12: Product Engagement Comparison for Charts & CSV
  const comparison = rankData.comparison;
  const t12Passed = Array.isArray(comparison) &&
    comparison.length > 0 &&
    comparison.some(p => p.productId === 'prod_aura_pro' && p.addToCart >= 1);
  console.log(`[${t12Passed ? 'PASS' : 'FAIL'}] 12. Product Engagement Comparison -> ${comparison?.length} products tracked, comparison dataset populated`);

  const allPassed = t1Passed && t2Passed && t3Passed && t4Passed && t5Passed && t6Passed && t7Passed && t8Passed && t9Passed && t10Passed && t11Passed && t12Passed;

  if (allPassed) {
    console.log('\n🎉 ALL 12 MANDATORY BACKEND API & ANALYTICS VERIFICATIONS PASSED 100%!');
  } else {
    console.error('\n❌ SOME TESTS FAILED');
    process.exit(1);
  }
}


runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
