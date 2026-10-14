import React from 'react';

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

export default function ProductRankings({
  rankings = {},
  loading = false,
  error = null,
  onRefresh
}) {
  const { mostClicked = [], mostAddedToCart = [], mostFavorited = [] } = rankings;

  return (
    <div style={{ marginTop: '36px' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🛍️</span>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Product Interaction <span style={{ color: 'var(--cf-blue)' }}>Rankings</span>
            </h2>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Computed via real-time MongoDB aggregation pipelines from genuine demo store interactions.
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-cf-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            <span>🔄</span>
            <span>Refresh Rankings</span>
          </button>
        )}
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

      {/* 3 Columns Grid */}
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
