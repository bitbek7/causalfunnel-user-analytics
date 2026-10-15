import React from 'react';

/**
 * Native CSV Export Utility
 * Generates an RFC 4180 compliant CSV file from real aggregated product analytics
 */
function handleExportCSV(comparisonData) {
  if (!comparisonData || comparisonData.length === 0) {
    alert('No product analytics data available to export.');
    return;
  }

  const headers = [
    'Rank',
    'Product ID',
    'Product Name',
    'Category',
    'Clicks',
    'Add to Cart',
    'Current Favorites',
    'Total Interactions'
  ];

  const rows = comparisonData.map((item, idx) => [
    item.rank || idx + 1,
    `"${(item.productId || '').replace(/"/g, '""')}"`,
    `"${(item.productName || '').replace(/"/g, '""')}"`,
    `"${(item.productCategory || '').replace(/"/g, '""')}"`,
    item.clicks || 0,
    item.addToCart || 0,
    item.favorites || 0,
    item.totalInteractions || 0
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `causalfunnel_product_analytics_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. KPI Stats Cards (matching CausalFunnel reference screenshot top row)
 */
function FunnelKpiCards({ funnel = {}, comparison = [], conversionMode = 'product' }) {
  const productViewSessions = funnel.productViewSessions || 0;
  const addToCartSessions = funnel.addToCartSessions || 0;
  const totalCartEvents = funnel.totalAddToCartEvents !== undefined && funnel.totalAddToCartEvents !== null
    ? funnel.totalAddToCartEvents
    : comparison.reduce((sum, item) => sum + (item.addToCart || 0), 0);

  // Distinct products explored vs added to cart
  const activeComparisonProducts = comparison.filter(p => (p.clicks > 0 || p.addToCart > 0 || p.favorites > 0));
  const distinctProductsViewed = funnel.distinctProductsViewed !== undefined
    ? funnel.distinctProductsViewed
    : (activeComparisonProducts.length > 0 ? activeComparisonProducts.length : (productViewSessions > 0 ? 1 : 0));
  const distinctProductsCarted = funnel.distinctProductsCarted !== undefined
    ? funnel.distinctProductsCarted
    : comparison.filter(p => p.addToCart > 0).length;

  const productRate = distinctProductsViewed > 0
    ? Math.round((distinctProductsCarted / distinctProductsViewed) * 1000) / 10
    : null;
  const productRateDisplay = funnel.productConversionRateFormatted || (productRate !== null ? `${productRate}%` : 'N/A');

  const sessionRate = productViewSessions > 0
    ? Math.round((addToCartSessions / productViewSessions) * 1000) / 10
    : null;
  const sessionRateDisplay = funnel.sessionConversionRateFormatted || (sessionRate !== null ? `${sessionRate}%` : 'N/A');

  const isProductMode = conversionMode === 'product';

  return (
    <div className="funnel-kpi-grid">
      {/* Card 1: Views */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-blue">
          <span>{isProductMode ? '🛍️' : '👥'}</span>
        </div>
        <div className="metric-info">
          <span className="metric-label" title={isProductMode ? "Products Explored" : "Product View Sessions"}>
            {isProductMode ? "Products Explored" : "Product View Sessions"}
          </span>
          <span className="metric-number" id="metric-view-sessions">
            {isProductMode ? distinctProductsViewed : productViewSessions}
          </span>
          <span className="metric-caption" title={isProductMode ? "Distinct store products viewed" : "Distinct sessions viewing products"}>
            {isProductMode
              ? (distinctProductsViewed === 1 ? '1 product explored' : `${distinctProductsViewed} products explored`)
              : (productViewSessions === 1 ? '1 visitor session' : `${productViewSessions} visitor sessions`)}
          </span>
        </div>
      </div>

      {/* Card 2: Cart Additions */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-amber">
          <span>🛒</span>
        </div>
        <div className="metric-info">
          <span className="metric-label" title={isProductMode ? "Products in Cart" : "Sessions with Cart Additions"}>
            {isProductMode ? "Products in Cart" : "Sessions with Cart Additions"}
          </span>
          <span className="metric-number" id="metric-cart-sessions">
            {isProductMode ? distinctProductsCarted : addToCartSessions}
          </span>
          <span className="metric-caption" title={isProductMode ? "Distinct products added to cart" : "Distinct sessions adding to cart"}>
            {isProductMode
              ? (distinctProductsCarted === 1 ? '1 item in cart' : `${distinctProductsCarted} items in cart`)
              : (addToCartSessions === 1 ? '1 cart session' : `${addToCartSessions} cart sessions`)}
          </span>
        </div>
      </div>

      {/* Card 3: Total Add-to-Cart Events */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-purple">
          <span>📦</span>
        </div>
        <div className="metric-info">
          <span className="metric-label" title="Total Add-to-Cart Events">Total Cart Actions</span>
          <span className="metric-number" id="metric-total-cart-events">{totalCartEvents}</span>
          <span className="metric-caption" title="Direct add-to-cart clicks recorded">
            {totalCartEvents === 1 ? '1 cart addition action' : `${totalCartEvents} cart addition actions`}
          </span>
        </div>
      </div>

      {/* Card 4: Add-to-Cart Rate */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-cyan">
          <span>🎯</span>
        </div>
        <div className="metric-info">
          <span className="metric-label" title={isProductMode ? "Product Add-to-Cart Rate" : "Session Conversion Rate"}>
            {isProductMode ? "Product Add-to-Cart Rate" : "Session Conversion Rate"}
          </span>
          <span
            className="metric-number"
            id="metric-conversion-rate"
            style={{ color: 'var(--cf-blue)' }}
          >
            {isProductMode ? productRateDisplay : sessionRateDisplay}
          </span>
          <span className="metric-caption" title={isProductMode ? `(${distinctProductsCarted} Carted / ${distinctProductsViewed} Explored Items) × 100` : `(${addToCartSessions} Cart Sessions / ${productViewSessions} View Sessions) × 100`}>
            {isProductMode
              ? `(${distinctProductsCarted} Carted / ${distinctProductsViewed} Explored) × 100`
              : `(${addToCartSessions} Cart / ${productViewSessions} View Sessions) × 100`}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Visual Step-Down Conversion Funnel
 */
function ConversionFunnelVisualizer({ funnel = {}, comparison = [], conversionMode = 'product', onToggleMode }) {
  const productViewSessions = funnel.productViewSessions || 0;
  const addToCartSessions = funnel.addToCartSessions || 0;

  const activeComparisonProducts = comparison.filter(p => (p.clicks > 0 || p.addToCart > 0 || p.favorites > 0));
  const distinctProductsViewed = funnel.distinctProductsViewed !== undefined
    ? funnel.distinctProductsViewed
    : (activeComparisonProducts.length > 0 ? activeComparisonProducts.length : (productViewSessions > 0 ? 1 : 0));
  const distinctProductsCarted = funnel.distinctProductsCarted !== undefined
    ? funnel.distinctProductsCarted
    : comparison.filter(p => p.addToCart > 0).length;

  const isProductMode = conversionMode === 'product';

  const viewCount = isProductMode ? distinctProductsViewed : productViewSessions;
  const cartCount = isProductMode ? distinctProductsCarted : addToCartSessions;

  const productRate = distinctProductsViewed > 0
    ? Math.round((distinctProductsCarted / distinctProductsViewed) * 1000) / 10
    : null;
  const productRateDisplay = funnel.productConversionRateFormatted || (productRate !== null ? `${productRate}%` : 'N/A');

  const sessionRate = productViewSessions > 0
    ? Math.round((addToCartSessions / productViewSessions) * 1000) / 10
    : null;
  const sessionRateDisplay = funnel.sessionConversionRateFormatted || (sessionRate !== null ? `${sessionRate}%` : 'N/A');

  const rateText = isProductMode ? productRateDisplay : sessionRateDisplay;
  const rateNum = isProductMode ? (productRate || 0) : (sessionRate || 0);

  return (
    <div className="card-panel" style={{ marginBottom: '24px' }}>
      <div className="card-header-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="card-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🌪️</span>
            <span>Product Conversion Funnel</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isProductMode
              ? `Item-level conversion: progression from viewed products to cart additions across the catalog.`
              : `Visitor-level conversion: progression from initial store visit to cart intent across distinct sessions.`}
          </div>
        </div>

        {/* Dimension Mode Toggle & Rate Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onToggleMode && (
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid #e2e8f0'
              }}
            >
              <button
                type="button"
                onClick={() => onToggleMode('product')}
                style={{
                  border: 'none',
                  background: isProductMode ? '#ffffff' : 'transparent',
                  color: isProductMode ? 'var(--cf-blue)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  boxShadow: isProductMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Accurate item-level conversion: items added to cart divided by items explored"
              >
                <span>🛍️</span>
                <span>By Product Items ({productRateDisplay})</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleMode('session')}
                style={{
                  border: 'none',
                  background: !isProductMode ? '#ffffff' : 'transparent',
                  color: !isProductMode ? 'var(--cf-blue)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  boxShadow: !isProductMode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Visitor session conversion: sessions with cart add divided by total sessions"
              >
                <span>👥</span>
                <span>By Visitor Sessions ({sessionRateDisplay})</span>
              </button>
            </div>
          )}

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: cartCount > 0 ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${cartCount > 0 ? '#a7f3d0' : '#e2e8f0'}`,
              color: cartCount > 0 ? '#065f46' : 'var(--text-muted)',
              padding: '5px 12px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            <span>🎯 {isProductMode ? 'Product Rate:' : 'Session Rate:'}</span>
            <span>{rateText}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {viewCount === 0 ? (
          <div className="empty-state-card" style={{ padding: '24px 16px' }}>
            <div className="empty-state-icon" style={{ fontSize: '28px' }}>🔍</div>
            <div className="empty-state-heading" style={{ fontSize: '14.5px' }}>No Product View Telemetry Recorded Yet</div>
            <div className="empty-state-text" style={{ fontSize: '12.5px' }}>
              Browse products or view product details on the Amazon Store demo to initiate the conversion funnel.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stage 1: Views */}
            <div className="funnel-stage-row">
              <div className="funnel-stage-label">
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  {isProductMode ? '1. Products Explored' : '1. Product Views'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {isProductMode
                    ? `${viewCount} distinct product${viewCount === 1 ? '' : 's'} viewed`
                    : `${viewCount} distinct session${viewCount === 1 ? '' : 's'}`}
                </div>
              </div>
              <div style={{ flexGrow: 1, width: '100%', background: '#f1f5f9', borderRadius: '10px', height: '28px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '12px',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '12px'
                  }}
                >
                  {isProductMode
                    ? `100% of Explored Catalog (${viewCount} Products)`
                    : `100% of Viewers (${viewCount} Sessions)`}
                </div>
              </div>
            </div>

            {/* Transition indicator */}
            <div className="funnel-transition-indicator">
              <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>⬇️</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: cartCount > 0 ? 'var(--cf-blue)' : 'var(--text-muted)' }}>
                {isProductMode
                  ? `${rateText} converted to shopping cart (${cartCount} of ${viewCount} products)`
                  : `${rateText} converted to shopping cart`}
              </span>
            </div>

            {/* Stage 2: Add to Cart */}
            <div className="funnel-stage-row">
              <div className="funnel-stage-label">
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  2. Added to Cart
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {isProductMode
                    ? `${cartCount} distinct product${cartCount === 1 ? '' : 's'} in cart`
                    : `${cartCount} distinct session${cartCount === 1 ? '' : 's'}`}
                </div>
              </div>
              <div style={{ flexGrow: 1, width: '100%', background: '#f1f5f9', borderRadius: '10px', height: '28px', overflow: 'hidden', position: 'relative' }}>
                {cartCount > 0 ? (
                  <div
                    style={{
                      width: `${Math.min(Math.max(rateNum, 5), 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '12px',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '12px',
                      transition: 'width 0.6s ease'
                    }}
                  >
                    {rateText} ({cartCount} {isProductMode ? 'item' : 'session'}{cartCount === 1 ? '' : 's'})
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: '12px',
                      color: 'var(--text-muted)',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}
                  >
                    0% (0 cart additions recorded)
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to truncate text with ellipsis
 */
function truncateChartText(str = '', maxLen = 16) {
  if (!str) return '';
  return str.length > maxLen ? `${str.substring(0, maxLen - 1)}…` : str;
}

/**
 * 3. Product Interaction Comparison Chart
 * Grouped Bar Chart comparing Clicks, Cart Additions, and Net Favorites
 * Includes:
 * - Filter by Active / Top 6 / All Catalog
 * - View Toggle: Grouped Columns (with -35° angled labels & hover card) vs Horizontal Ranking Bars
 * - Interactive hover tooltip with exact metric breakdown
 * - Responsive SVG and mobile layout
 */
function ProductEngagementChart({ comparison = [] }) {
  const [filterMode, setFilterMode] = React.useState('active'); // 'active' | 'top6' | 'all'
  const [chartView, setChartView] = React.useState('columns'); // 'columns' | 'bars'
  const [hoveredItem, setHoveredItem] = React.useState(null);
  const hoveredRef = React.useRef(null);

  const handleHover = React.useCallback((item) => {
    if (hoveredRef.current?.productId !== item.productId) {
      hoveredRef.current = item;
      setHoveredItem(item);
    }
  }, []);

  const handleLeave = React.useCallback(() => {
    hoveredRef.current = null;
    setHoveredItem(null);
  }, []);

  // Active items (items with at least 1 interaction)
  const activeItems = React.useMemo(
    () => comparison.filter(p => (p.totalInteractions || 0) > 0),
    [comparison]
  );

  // Top 6 items by total interactions
  const top6Items = React.useMemo(
    () => [...comparison].sort((a, b) => (b.totalInteractions || 0) - (a.totalInteractions || 0)).slice(0, 6),
    [comparison]
  );

  // Determine items to display based on active filter
  const displayedItems = React.useMemo(() => {
    if (filterMode === 'active') {
      return activeItems.length > 0 ? activeItems : top6Items;
    }
    if (filterMode === 'top6') {
      return top6Items;
    }
    return comparison;
  }, [filterMode, activeItems, top6Items, comparison]);

  // Find highest interaction count for scale
  const maxVal = Math.max(
    1,
    ...displayedItems.map(p => Math.max(p.clicks || 0, p.addToCart || 0, p.favorites || 0))
  );

  const hasInteractions = comparison.some(p => (p.totalInteractions || 0) > 0);

  // SVG Chart Dimensions for Column View
  const numItems = Math.max(1, displayedItems.length);
  const minItemWidth = 100;
  const padLeft = 52;
  const padRight = 30;
  const padTop = 36;
  const padBottom = 96; // Generous space for -35° angled labels
  const svgHeight = 330;
  const plotHeight = svgHeight - padTop - padBottom; // ~198px
  const svgWidth = Math.max(860, padLeft + padRight + numItems * minItemWidth);
  const plotWidth = svgWidth - padLeft - padRight;
  const groupWidth = plotWidth / numItems;
  const barWidth = Math.max(12, Math.min(22, (groupWidth - 32) / 3));

  // Y-axis grid ticks (0, 1/3, 2/3, max)
  const ticks = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];
  const uniqueTicks = Array.from(new Set(ticks)).sort((a, b) => a - b);

  return (
    <div className="card-panel" style={{ marginBottom: '24px' }}>
      <div className="card-header-bar">
        <div>
          <div className="card-header-title">
            <span>📊</span>
            <span>Product Engagement Comparison</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Multi-signal comparison across Product Clicks, Add-to-Cart events, and Net Active Favorites.
          </div>
        </div>

        {/* Filter & View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Dataset Filter Pills */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '9999px', border: '1px solid var(--border-card)' }}>
            <button
              onClick={() => setFilterMode('active')}
              style={{
                background: filterMode === 'active' ? '#ffffff' : 'transparent',
                color: filterMode === 'active' ? 'var(--cf-blue)' : 'var(--text-muted)',
                fontWeight: filterMode === 'active' ? 700 : 500,
                border: 'none',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: filterMode === 'active' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Show only products with recorded activity"
            >
              🔥 Active ({activeItems.length})
            </button>
            <button
              onClick={() => setFilterMode('top6')}
              style={{
                background: filterMode === 'top6' ? '#ffffff' : 'transparent',
                color: filterMode === 'top6' ? 'var(--cf-blue)' : 'var(--text-muted)',
                fontWeight: filterMode === 'top6' ? 700 : 500,
                border: 'none',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: filterMode === 'top6' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Show top 6 ranked products"
            >
              ⭐ Top 6
            </button>
            <button
              onClick={() => setFilterMode('all')}
              style={{
                background: filterMode === 'all' ? '#ffffff' : 'transparent',
                color: filterMode === 'all' ? 'var(--cf-blue)' : 'var(--text-muted)',
                fontWeight: filterMode === 'all' ? 700 : 500,
                border: 'none',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: filterMode === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease'
              }}
              title="Show all catalog products"
            >
              📦 All ({comparison.length})
            </button>
          </div>

          {/* View Mode Toggle: Columns vs Horizontal Bars */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '9999px', border: '1px solid var(--border-card)' }}>
            <button
              onClick={() => setChartView('columns')}
              style={{
                background: chartView === 'columns' ? '#ffffff' : 'transparent',
                color: chartView === 'columns' ? 'var(--cf-blue)' : 'var(--text-muted)',
                fontWeight: chartView === 'columns' ? 700 : 500,
                border: 'none',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: chartView === 'columns' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
              }}
              title="Grouped column chart view"
            >
              📊 Columns
            </button>
            <button
              onClick={() => setChartView('bars')}
              style={{
                background: chartView === 'bars' ? '#ffffff' : 'transparent',
                color: chartView === 'bars' ? 'var(--cf-blue)' : 'var(--text-muted)',
                fontWeight: chartView === 'bars' ? 700 : 500,
                border: 'none',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                cursor: 'pointer',
                boxShadow: chartView === 'bars' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none'
              }}
              title="Horizontal ranking bars view (immune to text overlap)"
            >
              📑 Bars
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
              <span>Clicks</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
              <span>Cart</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600 }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#f43f5e', display: 'inline-block' }}></span>
              <span>Favorites</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Tooltip & Inspection Strip (Fixed height guarantees 0px layout shift & zero flicker) */}
      <div
        style={{
          margin: '12px 20px 0',
          padding: '8px 16px',
          minHeight: '44px',
          boxSizing: 'border-box',
          background: hoveredItem
            ? 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)'
            : '#f8fafc',
          border: `1px solid ${hoveredItem ? '#bfdbfe' : '#e2e8f0'}`,
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          fontSize: '12.5px',
          transition: 'background 0.15s ease, border-color 0.15s ease'
        }}
      >
        {hoveredItem ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{hoveredItem.productName}</span>
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                {hoveredItem.productCategory}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                ({hoveredItem.productId})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontWeight: 700, flexWrap: 'wrap' }}>
              <span style={{ color: '#b45309' }}>🖱️ {hoveredItem.clicks} Clicks</span>
              <span style={{ color: '#047857' }}>🛒 {hoveredItem.addToCart} Cart</span>
              <span style={{ color: '#be123c' }}>❤️ {hoveredItem.favorites} Net Favs</span>
              <span style={{ color: 'var(--cf-blue)' }}>⚡ {hoveredItem.totalInteractions} Total</span>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '12px' }}>
            <span>💡</span>
            <span>Hover or tap any product column, bar, or label to inspect live telemetry breakdown</span>
          </div>
        )}
      </div>

      <div style={{ padding: '20px', overflowX: 'auto' }}>
        {!hasInteractions ? (
          <div className="empty-state-card" style={{ padding: '40px 16px' }}>
            <div className="empty-state-icon" style={{ fontSize: '32px' }}>📊</div>
            <div className="empty-state-heading" style={{ fontSize: '15px' }}>No Product Engagement Data Yet</div>
            <div className="empty-state-text" style={{ fontSize: '12.5px' }}>
              Interact with products on the Amazon Store demo (clicks, cart, or favorites) to visualize comparison metrics.
            </div>
          </div>
        ) : chartView === 'bars' ? (
          /* Horizontal Ranking Bars View */
          <div className="horizontal-bars-container">
            {displayedItems.map((item, idx) => (
              <div
                key={item.productId || idx}
                className="horizontal-bar-row"
                onMouseEnter={() => handleHover(item)}
                onMouseLeave={handleLeave}
              >
                <div className="horizontal-bar-meta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cf-blue)', background: 'var(--cf-blue-light)', padding: '1px 6px', borderRadius: '4px' }}>
                      #{idx + 1}
                    </span>
                    <span className="bar-product-name" title={item.productName}>
                      {item.productName}
                    </span>
                  </div>
                  <span className="bar-category-tag">{item.productCategory}</span>
                </div>

                <div className="horizontal-bar-tracks">
                  {/* Clicks Track */}
                  <div className="bar-track-row">
                    <span className="bar-track-label">Clicks</span>
                    <div className="bar-track-bg">
                      <div
                        className="bar-fill amber"
                        style={{ width: `${maxVal > 0 ? (item.clicks / maxVal) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="bar-track-val">{item.clicks}</span>
                  </div>

                  {/* Add to Cart Track */}
                  <div className="bar-track-row">
                    <span className="bar-track-label">Cart</span>
                    <div className="bar-track-bg">
                      <div
                        className="bar-fill emerald"
                        style={{ width: `${maxVal > 0 ? (item.addToCart / maxVal) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="bar-track-val">{item.addToCart}</span>
                  </div>

                  {/* Favorites Track */}
                  <div className="bar-track-row">
                    <span className="bar-track-label">Favs</span>
                    <div className="bar-track-bg">
                      <div
                        className="bar-fill rose"
                        style={{ width: `${maxVal > 0 ? (item.favorites / maxVal) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <span className="bar-track-val">{item.favorites}</span>
                  </div>
                </div>

                <div className="horizontal-bar-total">
                  <strong>{item.totalInteractions}</strong>
                  <span>actions</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Column View with Angled Collision-Proof Labels */
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', minWidth: `${Math.min(svgWidth, 680)}px`, display: 'block' }}
          >
            {/* Horizontal Gridlines & Y-axis labels */}
            {uniqueTicks.map((tickVal, idx) => {
              const yPos = padTop + plotHeight - (tickVal / maxVal) * plotHeight;
              return (
                <g key={`tick-${idx}`}>
                  <line
                    x1={padLeft}
                    y1={yPos}
                    x2={svgWidth - padRight}
                    y2={yPos}
                    stroke="#e2e8f0"
                    strokeDasharray={idx === 0 ? 'none' : '4 4'}
                    strokeWidth={idx === 0 ? 1.5 : 1}
                  />
                  <text
                    x={padLeft - 8}
                    y={yPos + 4}
                    textAnchor="end"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fill="#94a3b8"
                  >
                    {tickVal}
                  </text>
                </g>
              );
            })}

            {/* Product Groups */}
            {displayedItems.map((item, groupIdx) => {
              const groupCenterX = padLeft + groupIdx * groupWidth + groupWidth / 2;
              const totalBarsWidth = barWidth * 3 + 8;
              const startX = groupCenterX - totalBarsWidth / 2;

              const clickH = ((item.clicks || 0) / maxVal) * plotHeight;
              const cartH = ((item.addToCart || 0) / maxVal) * plotHeight;
              const favH = ((item.favorites || 0) / maxVal) * plotHeight;

              const clickY = padTop + plotHeight - clickH;
              const cartY = padTop + plotHeight - cartH;
              const favY = padTop + plotHeight - favH;
              const isHovered = hoveredItem?.productId === item.productId;

              return (
                <g
                  key={item.productId || groupIdx}
                  onMouseEnter={() => handleHover(item)}
                  onMouseLeave={handleLeave}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Full-column continuous hit-target and highlight background */}
                  <rect
                    x={groupCenterX - groupWidth / 2 + 2}
                    y={padTop}
                    width={groupWidth - 4}
                    height={svgHeight - padTop}
                    fill={isHovered ? "rgba(37, 99, 235, 0.06)" : "transparent"}
                    rx="8"
                    style={{ pointerEvents: 'all' }}
                  />

                  {/* Bar 1: Clicks (Amber) */}
                  <rect
                    x={startX}
                    y={clickY}
                    width={barWidth}
                    height={Math.max(clickH, 0)}
                    fill="#f59e0b"
                    rx="4"
                  >
                    <title>{`${item.productName} — Clicks: ${item.clicks}`}</title>
                  </rect>
                  {item.clicks > 0 && (
                    <text
                      x={startX + barWidth / 2}
                      y={clickY - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#b45309"
                    >
                      {item.clicks}
                    </text>
                  )}

                  {/* Bar 2: Add to Cart (Emerald) */}
                  <rect
                    x={startX + barWidth + 4}
                    y={cartY}
                    width={barWidth}
                    height={Math.max(cartH, 0)}
                    fill="#10b981"
                    rx="4"
                  >
                    <title>{`${item.productName} — Add to Cart: ${item.addToCart}`}</title>
                  </rect>
                  {item.addToCart > 0 && (
                    <text
                      x={startX + barWidth + 4 + barWidth / 2}
                      y={cartY - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#047857"
                    >
                      {item.addToCart}
                    </text>
                  )}

                  {/* Bar 3: Favorites (Rose) */}
                  <rect
                    x={startX + (barWidth + 4) * 2}
                    y={favY}
                    width={barWidth}
                    height={Math.max(favH, 0)}
                    fill="#f43f5e"
                    rx="4"
                  >
                    <title>{`${item.productName} — Favorites: ${item.favorites}`}</title>
                  </rect>
                  {item.favorites > 0 && (
                    <text
                      x={startX + (barWidth + 4) * 2 + barWidth / 2}
                      y={favY - 5}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#be123c"
                    >
                      {item.favorites}
                    </text>
                  )}

                  {/* Collision-Proof Angled Labels (-35° rotation) */}
                  <g transform={`translate(${groupCenterX}, ${svgHeight - padBottom + 16}) rotate(-35)`}>
                    <text
                      textAnchor="end"
                      fontSize="11"
                      fontWeight={isHovered ? '800' : '700'}
                      fill={isHovered ? '#2563eb' : '#1e293b'}
                    >
                      {truncateChartText(item.productName, 18)}
                      <title>{item.productName} ({item.productCategory})</title>
                    </text>
                    <text
                      textAnchor="end"
                      y="13"
                      fontSize="9.5"
                      fill="#64748b"
                      fontFamily="var(--font-mono)"
                    >
                      {truncateChartText(item.productCategory || item.productId, 16)}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

/**
 * 4. Ranking Card Item
 */
function RankingCard({
  title,
  icon,
  accentColor,
  countLabel,
  description,
  items = [],
  emptyMessage,
  cardId
}) {
  return (
    <div className="card-panel" id={cardId} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="card-header-bar" style={{ borderBottom: `2px solid ${accentColor}22` }}>
        <div>
          <div className="card-header-title">
            <span>{icon}</span>
            <span>{title}</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {description}
          </div>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: accentColor,
            background: `${accentColor}15`,
            border: `1px solid ${accentColor}33`,
            padding: '3px 8px',
            borderRadius: '9999px'
          }}
        >
          {items.length} Tracked
        </span>
      </div>

      {/* Content */}
      <div style={{ flexGrow: 1, padding: items.length > 0 ? '12px 16px' : '0' }}>
        {items.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '40px 16px' }}>
            <div className="empty-state-icon" style={{ fontSize: '32px' }}>{icon}</div>
            <div className="empty-state-heading" style={{ fontSize: '15px' }}>No Data Yet</div>
            <div className="empty-state-text" style={{ fontSize: '12.5px' }}>{emptyMessage}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {items.map((item, idx) => {
              const rank = item.rank || idx + 1;
              const isTop = rank === 1;

              return (
                <div
                  key={item.productId || idx}
                  className="ranking-item-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: isTop ? `${accentColor}0a` : '#f8fafc',
                    border: `1px solid ${isTop ? `${accentColor}33` : '#e2e8f0'}`,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Left: Rank & Product Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '13px',
                        flexShrink: 0,
                        background: isTop ? accentColor : '#ffffff',
                        color: isTop ? '#ffffff' : 'var(--text-secondary)',
                        border: `1px solid ${isTop ? accentColor : '#cbd5e1'}`
                      }}
                    >
                      {rank}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '13.5px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={item.productName}
                      >
                        {item.productName}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--font-mono)',
                          marginTop: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>{item.productId}</span>
                        {item.productCategory && (
                          <span
                            style={{
                              background: '#e2e8f0',
                              color: '#334155',
                              padding: '0 5px',
                              borderRadius: '4px',
                              fontSize: '10px'
                            }}
                          >
                            {item.productCategory}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Count Badge */}
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontWeight: 800,
                        fontSize: '13px',
                        background: '#ffffff',
                        color: accentColor,
                        border: `1px solid ${accentColor}44`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                      }}
                    >
                      <span>{item.count}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {countLabel}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main Product Analytics Dashboard Section
 */
export default function ProductRankings({
  productData = {},
  rankings = {},
  loading = false,
  error = null,
  onRefresh
}) {
  // Support both unified productData object and legacy direct rankings prop
  const activeRankings = productData.rankings || rankings || {};
  const funnel = productData.funnel || {};
  const comparison = productData.comparison || [];

  // Default to 'product' so when viewing multiple items and adding 1, it calculates the accurate product conversion (e.g. 1/6 = 16.7%)
  const [conversionMode, setConversionMode] = React.useState('product'); // 'product' or 'session'

  const { mostClicked = [], mostAddedToCart = [], mostFavorited = [] } = activeRankings;

  return (
    <div style={{ marginTop: '10px' }}>
      {/* Section Header with Export to CSV Button & Refresh */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '14px',
          background: '#ffffff',
          border: '1px solid var(--border-card)',
          borderRadius: '16px',
          padding: '16px 22px',
          boxShadow: 'var(--shadow-card)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '30px' }}>🛍️</span>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
                Product <span style={{ color: 'var(--cf-blue)' }}>Analytics & Conversion</span>
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px', margin: 0 }}>
                Track product performance rankings, real-time conversion funnels, and multi-signal engagement comparison.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Export to CSV + Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            id="btn-export-csv"
            className="btn-export-csv"
            onClick={() => handleExportCSV(comparison)}
            title="Export real aggregated product analytics to CSV"
          >
            <span>📥</span>
            <span>Export to CSV</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="btn-cf-secondary"
              style={{ fontSize: '12.5px', padding: '7px 16px' }}
              title="Refresh product analytics from database"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          style={{
            padding: '14px 20px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#991b1b',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* 1. Funnel KPI Cards (supporting accurate product items mode and visitor sessions mode) */}
      <FunnelKpiCards
        funnel={funnel}
        comparison={comparison}
        conversionMode={conversionMode}
      />

      {/* 2. Visual Conversion Funnel Card with Mode Switcher */}
      <ConversionFunnelVisualizer
        funnel={funnel}
        comparison={comparison}
        conversionMode={conversionMode}
        onToggleMode={setConversionMode}
      />

      {/* 3. Product Engagement Comparison Chart */}
      <ProductEngagementChart comparison={comparison} />

      {/* 4. Product Performance Rankings (3 Columns Side-by-Side) */}
      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '14px' }}>
          🏆 Product Performance Rankings
        </h3>
      </div>

      <div
        className="product-rankings-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          alignItems: 'stretch'
        }}
      >
        {/* Column 1: Most Clicked */}
        <RankingCard
          cardId="ranking-card-clicked"
          title="Most-Clicked Products"
          icon="🖱️"
          accentColor="#b45309"
          countLabel="clicks"
          description="Direct clicks on product cards"
          items={mostClicked}
          emptyMessage="No product clicks recorded yet. Click on product cards in the demo store."
        />

        {/* Column 2: Most Added to Cart */}
        <RankingCard
          cardId="ranking-card-cart"
          title="Most Added to Cart"
          icon="🛒"
          accentColor="#059669"
          countLabel="added"
          description="Add-to-cart conversions"
          items={mostAddedToCart}
          emptyMessage="No cart additions recorded yet. Click 'Add to Cart' on demo products."
        />

        {/* Column 3: Most Favorited */}
        <RankingCard
          cardId="ranking-card-favorites"
          title="Most-Favorited Products"
          icon="❤️"
          accentColor="#e11d48"
          countLabel="favorites"
          description="Net active favorites (favs minus unfavs)"
          items={mostFavorited}
          emptyMessage="No active favorites yet. Click '♡ Favorite' on demo products."
        />
      </div>
    </div>
  );
}
