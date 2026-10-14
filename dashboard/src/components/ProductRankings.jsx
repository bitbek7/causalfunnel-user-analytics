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
function FunnelKpiCards({ funnel = {}, comparison = [] }) {
  const totalInteractions = comparison.reduce((sum, item) => sum + (item.totalInteractions || 0), 0);
  const conversionRateDisplay = funnel.conversionRateFormatted || 'N/A';
  const hasRate = funnel.conversionRate !== null && funnel.conversionRate !== undefined;

  return (
    <div className="funnel-kpi-grid">
      {/* Card 1: Product View Sessions */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-blue">
          <span>👥</span>
        </div>
        <div className="metric-info">
          <span className="metric-label">Product View Sessions</span>
          <span className="metric-number">{funnel.productViewSessions || 0}</span>
          <span className="metric-caption">Distinct sessions viewing products</span>
        </div>
      </div>

      {/* Card 2: Add to Cart Sessions */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-amber">
          <span>🛒</span>
        </div>
        <div className="metric-info">
          <span className="metric-label">Add to Cart Sessions</span>
          <span className="metric-number">{funnel.addToCartSessions || 0}</span>
          <span className="metric-caption">Distinct sessions adding to cart</span>
        </div>
      </div>

      {/* Card 3: Add to Cart Rate (overall) */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-cyan">
          <span>📊</span>
        </div>
        <div className="metric-info">
          <span className="metric-label">Add to Cart Rate</span>
          <span
            className="metric-number"
            style={{ color: hasRate ? 'var(--cf-blue)' : 'var(--text-light)' }}
          >
            {conversionRateDisplay}
          </span>
          <span className="metric-caption">(Cart Sessions / View Sessions) × 100</span>
        </div>
      </div>

      {/* Card 4: Total Product Interactions */}
      <div className="metric-card-white">
        <div className="metric-icon-bubble bubble-purple">
          <span>⚡</span>
        </div>
        <div className="metric-info">
          <span className="metric-label">Total Interactions</span>
          <span className="metric-number">{totalInteractions}</span>
          <span className="metric-caption">Direct product actions recorded</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Visual Step-Down Conversion Funnel
 */
function ConversionFunnelVisualizer({ funnel = {} }) {
  const viewSessions = funnel.productViewSessions || 0;
  const cartSessions = funnel.addToCartSessions || 0;
  const rateText = funnel.conversionRateFormatted || 'N/A';
  const rateNum = funnel.conversionRate || 0;

  return (
    <div className="card-panel" style={{ marginBottom: '24px' }}>
      <div className="card-header-bar">
        <div>
          <div className="card-header-title">
            <span>🌪️</span>
            <span>Product Conversion Funnel</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Progression from initial product view to cart intent across distinct browser sessions.
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <span>🎯 Conversion Rate:</span>
          <span>{rateText}</span>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        {viewSessions === 0 ? (
          <div className="empty-state-card" style={{ padding: '24px 16px' }}>
            <div className="empty-state-icon" style={{ fontSize: '28px' }}>🔍</div>
            <div className="empty-state-heading" style={{ fontSize: '14.5px' }}>No Product View Telemetry Recorded Yet</div>
            <div className="empty-state-text" style={{ fontSize: '12.5px' }}>
              Browse products or view product details on the Aura Audio demo store to initiate the conversion funnel.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stage 1: Product Views */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '160px', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  1. Product Views
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {viewSessions} distinct session{viewSessions === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ flexGrow: 1, background: '#f1f5f9', borderRadius: '10px', height: '28px', overflow: 'hidden' }}>
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
                  100% of Viewers ({viewSessions})
                </div>
              </div>
            </div>

            {/* Transition indicator */}
            <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '176px', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-light)' }}>⬇️</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--cf-blue)' }}>
                {rateText} converted to shopping cart
              </span>
            </div>

            {/* Stage 2: Add to Cart */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '160px', flexShrink: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  2. Added to Cart
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  {cartSessions} distinct session{cartSessions === 1 ? '' : 's'}
                </div>
              </div>
              <div style={{ flexGrow: 1, background: '#f1f5f9', borderRadius: '10px', height: '28px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(Math.max(rateNum, 4), 100)}%`,
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
                  {rateText} ({cartSessions})
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. Product Interaction Comparison Chart
 * Pure React SVG Grouped Bar Chart comparing Clicks, Cart Additions, and Net Favorites
 */
function ProductEngagementChart({ comparison = [] }) {
  // Find highest interaction count for scale
  const maxVal = Math.max(
    1,
    ...comparison.map(p => Math.max(p.clicks || 0, p.addToCart || 0, p.favorites || 0))
  );

  const hasInteractions = comparison.some(p => p.totalInteractions > 0);

  // SVG Chart Dimensions
  const svgWidth = 860;
  const svgHeight = 260;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 30;
  const padBottom = 55;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const numItems = comparison.length || 1;
  const groupWidth = plotWidth / numItems;
  const barWidth = Math.max(12, Math.min(26, (groupWidth - 36) / 3));

  // Y-axis grid ticks
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

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f59e0b', display: 'inline-block' }}></span>
            <span>Product Clicks</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981', display: 'inline-block' }}></span>
            <span>Add to Cart</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f43f5e', display: 'inline-block' }}></span>
            <span>Active Favorites</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px', overflowX: 'auto' }}>
        {!hasInteractions ? (
          <div className="empty-state-card" style={{ padding: '40px 16px' }}>
            <div className="empty-state-icon" style={{ fontSize: '32px' }}>📊</div>
            <div className="empty-state-heading" style={{ fontSize: '15px' }}>No Product Engagement Data Yet</div>
            <div className="empty-state-text" style={{ fontSize: '12.5px' }}>
              Interact with products on the Aura Audio demo store (clicks, cart, or favorites) to visualize comparison metrics.
            </div>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            style={{ width: '100%', height: 'auto', minWidth: '600px', display: 'block' }}
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
            {comparison.map((item, groupIdx) => {
              const groupCenterX = padLeft + groupIdx * groupWidth + groupWidth / 2;
              const totalBarsWidth = barWidth * 3 + 8;
              const startX = groupCenterX - totalBarsWidth / 2;

              const clickH = ((item.clicks || 0) / maxVal) * plotHeight;
              const cartH = ((item.addToCart || 0) / maxVal) * plotHeight;
              const favH = ((item.favorites || 0) / maxVal) * plotHeight;

              const clickY = padTop + plotHeight - clickH;
              const cartY = padTop + plotHeight - cartH;
              const favY = padTop + plotHeight - favH;

              return (
                <g key={item.productId || groupIdx}>
                  {/* Bar 1: Clicks (Amber) */}
                  <rect
                    x={startX}
                    y={clickY}
                    width={barWidth}
                    height={Math.max(clickH, 0)}
                    fill="#f59e0b"
                    rx="4"
                    title={`${item.productName} Clicks: ${item.clicks}`}
                  />
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
                    title={`${item.productName} Add to Cart: ${item.addToCart}`}
                  />
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
                    title={`${item.productName} Favorites: ${item.favorites}`}
                  />
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

                  {/* Product Label under group */}
                  <text
                    x={groupCenterX}
                    y={svgHeight - padBottom + 18}
                    textAnchor="middle"
                    fontSize="11.5"
                    fontWeight="700"
                    fill="#1e293b"
                  >
                    {item.productName}
                  </text>
                  <text
                    x={groupCenterX}
                    y={svgHeight - padBottom + 32}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                    fontFamily="var(--font-mono)"
                  >
                    {item.productCategory || item.productId}
                  </text>
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

  const { mostClicked = [], mostAddedToCart = [], mostFavorited = [] } = activeRankings;

  return (
    <div style={{ marginTop: '28px' }}>
      {/* Section Header with Export to CSV Button (matching reference screenshot) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>🛍️</span>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
                Product <span style={{ color: 'var(--cf-blue)' }}>Analytics & Conversion</span>
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                Real-time conversion funnels, engagement comparison, and performance rankings backed by MongoDB telemetry.
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

      {/* 1. Funnel KPI Cards (matching reference screenshot top row) */}
      <FunnelKpiCards funnel={funnel} comparison={comparison} />

      {/* 2. Visual Conversion Funnel Card */}
      <ConversionFunnelVisualizer funnel={funnel} />

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
