import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchHeatmap, fetchTrackedPages } from '../services/api';

export default function HeatmapView() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Visual modes: Default is 'points' (Simple dot-based click visualization)
  const [visualMode, setVisualMode] = useState('points'); // 'points' | 'density'
  const [showGrid, setShowGrid] = useState(true);
  const [dotRadius, setDotRadius] = useState(24);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const canvasRef = useRef(null);

  // Load tracked page URLs on mount
  useEffect(() => {
    async function loadPages() {
      try {
        const res = await fetchTrackedPages();
        if (res.success && res.data.length > 0) {
          setPages(res.data);
          const sorted = [...res.data].sort((a, b) => b.clicks - a.clicks);
          setSelectedPage(sorted[0].pageUrl);
        } else {
          const fallbackPages = [
            { pageUrl: '/demo/index.html', clicks: 0 },
            { pageUrl: '/demo/product.html', clicks: 0 }
          ];
          setPages(fallbackPages);
          setSelectedPage(fallbackPages[0].pageUrl);
        }
      } catch (e) {
        console.error('Failed to load tracked pages', e);
      }
    }
    loadPages();
  }, []);

  // Fetch heatmap data when page selection changes
  useEffect(() => {
    if (!selectedPage) return;

    let isMounted = true;
    async function loadHeatmap() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchHeatmap(selectedPage);
        if (isMounted) {
          setHeatmapData(res);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadHeatmap();
    return () => { isMounted = false; };
  }, [selectedPage]);

  // Group overlapping clicks sharing identical coordinates (e.g. repeated clicks on the same button)
  const clusters = useMemo(() => {
    if (!heatmapData || !heatmapData.clicks || heatmapData.clicks.length === 0) {
      return [];
    }

    const clickList = heatmapData.clicks;
    const grouped = [];

    clickList.forEach((c) => {
      // Direct coordinate match (within 6px radius)
      const existing = grouped.find((g) => Math.hypot(g.x - c.x, g.y - c.y) <= 6);

      if (existing) {
        existing.count += 1;
        existing.items.push(c);
      } else {
        grouped.push({
          x: c.x,
          y: c.y,
          count: 1,
          elementTag: c.elementTag,
          elementText: c.elementText,
          items: [c]
        });
      }
    });

    return grouped;
  }, [heatmapData]);

  // Compute dynamic canvas dimensions to ensure every real click coordinate fits without clipping
  const canvasDimensions = useMemo(() => {
    const maxX = heatmapData?.bounds?.maxX || 1000;
    const maxY = heatmapData?.bounds?.maxY || 600;
    return {
      width: Math.max(1050, maxX + 60),
      height: Math.max(620, maxY + 60)
    };
  }, [heatmapData]);

  // Draw Heatmap / Point Markers onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Clean white canvas background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Grid Overlay
    if (showGrid) {
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      const gridSize = 50;

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Major coordinate grid lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      for (let x = 200; x <= width; x += 200) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 200; y <= height; y += 200) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Coordinate numbers
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono, monospace';
      for (let x = 100; x < width; x += 100) {
        ctx.fillText(`${x}px`, x + 4, 14);
      }
      for (let y = 100; y < height; y += 100) {
        ctx.fillText(`${y}px`, 4, y - 4);
      }
    }

    // Empty state watermark
    if (!heatmapData || !heatmapData.clicks || heatmapData.clicks.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No click events recorded for this URL yet', width / 2, height / 2);
      ctx.textAlign = 'start';
      return;
    }

    // 2. Primary Visualization: Simple Dot-Based Click Visualization
    if (visualMode === 'points') {
      clusters.forEach((cl) => {
        // Render dots at exact real coordinates
        const x = cl.x;
        const y = cl.y;
        const markerRadius = cl.count > 1 ? 8 : 6;

        // Outer glow
        ctx.fillStyle = cl.count > 1 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, markerRadius + 8, 0, Math.PI * 2);
        ctx.fill();

        // Secondary ring
        ctx.fillStyle = cl.count > 1 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(37, 99, 235, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, markerRadius + 3, 0, Math.PI * 2);
        ctx.fill();

        // Solid Dot Marker
        ctx.fillStyle = cl.count > 1 ? '#ef4444' : '#2563eb';
        ctx.beginPath();
        ctx.arc(x, y, markerRadius, 0, Math.PI * 2);
        ctx.fill();

        // Center White Pin
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Frequency Badge if multiple clicks landed on the exact same location
        if (cl.count > 1) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 11px Inter, sans-serif';
          const label = `${cl.count}x`;
          const textWidth = ctx.measureText(label).width;

          ctx.beginPath();
          ctx.roundRect(x - textWidth / 2 - 4, y - 22, textWidth + 8, 15, 6);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, x - textWidth / 2, y - 11);
        }
      });
    }

    // 3. Optional Density Heatmap Mode
    if (visualMode === 'density') {
      heatmapData.clicks.forEach((c) => {
        const radGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, dotRadius);
        radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');    // Red core
        radGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.65)'); // Amber mid
        radGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.25)'); // Blue outer
        radGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 4. Highlight hovered point
    if (hoveredPoint) {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 20, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(2, 132, 199, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hoveredPoint.x - 26, hoveredPoint.y);
      ctx.lineTo(hoveredPoint.x + 26, hoveredPoint.y);
      ctx.moveTo(hoveredPoint.x, hoveredPoint.y - 26);
      ctx.lineTo(hoveredPoint.x, hoveredPoint.y + 26);
      ctx.stroke();
    }
  }, [heatmapData, clusters, visualMode, showGrid, dotRadius, hoveredPoint]);

  // Handle canvas mouse move for interactive inspection
  const handleCanvasMouseMove = (e) => {
    if (!clusters || clusters.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    let closest = null;
    let minDist = 26;

    clusters.forEach((cl) => {
      const dist = Math.hypot(cl.x - mouseX, cl.y - mouseY);
      if (dist < minDist) {
        minDist = dist;
        closest = cl;
      }
    });

    setHoveredPoint(closest);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="heatmap-container-box">
      {/* Page Heading & Subtitle */}
      <div className="section-hero" style={{ margin: '10px 0 24px' }}>
        <h1>Click <span className="brand-accent">Heatmap</span></h1>
        <p>Visualize visitor click positions and behavioral concentration across pages.</p>
      </div>

      {/* Control Bar Card */}
      <div className="heatmap-controls-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <label
              htmlFor="select-page-url"
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '4px',
                textTransform: 'uppercase',
                fontWeight: 700
              }}
            >
              Select Page URL
            </label>
            <select
              id="select-page-url"
              className="select-page-dropdown"
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
            >
              {pages.map((p) => (
                <option key={p.pageUrl} value={p.pageUrl}>
                  {p.pageUrl} ({p.clicks || 0} clicks)
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
            <button
              id="btn-mode-dots"
              className={`btn-cf-primary ${visualMode === 'points' ? '' : 'btn-cf-secondary'}`}
              onClick={() => setVisualMode('points')}
              style={{
                background: visualMode === 'points' ? 'var(--cf-blue)' : '#ffffff',
                color: visualMode === 'points' ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              🎯 Point Markers
            </button>
            <button
              id="btn-mode-density"
              className={`btn-cf-primary ${visualMode === 'density' ? '' : 'btn-cf-secondary'}`}
              onClick={() => setVisualMode('density')}
              style={{
                background: visualMode === 'density' ? 'var(--cf-blue)' : '#ffffff',
                color: visualMode === 'density' ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              🔥 Density Map
            </button>
          </div>
        </div>

        {/* Right Side Options & Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 500 }}>
            <input
              type="checkbox"
              id="checkbox-show-grid"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
            />
            <span>Coordinate Grid</span>
          </label>

          {visualMode === 'density' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Radius:</span>
              <input
                id="range-radius"
                type="range"
                min="15"
                max="50"
                value={dotRadius}
                onChange={(e) => setDotRadius(Number(e.target.value))}
                style={{ width: '90px' }}
              />
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--cf-blue)', fontWeight: 700 }}>
                {dotRadius}px
              </span>
            </div>
          )}

          {/* Recorded Clicks Count Badge */}
          <div className="badge-event-count" id="badge-total-page-clicks" style={{ fontSize: '13px', padding: '6px 14px' }}>
            {heatmapData ? `${heatmapData.totalClicks} recorded clicks` : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Main Canvas Frame */}
      <div className="canvas-card-frame">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Interaction Canvas: <span style={{ color: 'var(--cf-blue)', fontFamily: 'var(--font-mono)' }}>{selectedPage}</span>
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Dot-based click positions retrieved from MongoDB. Hover over any dot to inspect exact coordinates.
            </p>
          </div>

          {/* Live Hover Tooltip */}
          {hoveredPoint && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.15)'
              }}
            >
              <span style={{ color: '#b45309', fontWeight: 700 }}>
                🎯 (x: {hoveredPoint.x}, y: {hoveredPoint.y})
              </span>
              <span style={{ color: 'var(--cf-blue)', fontWeight: 700 }}>
                {hoveredPoint.count} {hoveredPoint.count === 1 ? 'click' : 'clicks here'}
              </span>
              {hoveredPoint.elementTag && (
                <span style={{ color: 'var(--text-muted)' }}>
                  &lt;{hoveredPoint.elementTag}&gt; {hoveredPoint.elementText ? `"${hoveredPoint.elementText}"` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Canvas Display Area */}
        <div className="canvas-viewport-wrapper">
          <div className="canvas-element-box">
            <canvas
              id="heatmap-canvas"
              ref={canvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              className="canvas-element"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            />
          </div>
        </div>
      </div>

      {/* Click Coordinate Registry Table (Full data transparency) */}
      {heatmapData && heatmapData.clicks && heatmapData.clicks.length > 0 && (
        <div className="card-panel">
          <div className="card-header-bar">
            <div className="card-header-title">
              <span>📊</span>
              <span>Click Coordinate Registry</span>
              <span className="badge-event-count">
                {heatmapData.clicks.length} points
              </span>
            </div>
          </div>

          <div className="sessions-table-wrapper" style={{ maxHeight: '280px' }}>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>X Coordinate</th>
                  <th>Y Coordinate</th>
                  <th>Target Element</th>
                  <th>Text Snippet</th>
                  <th>Timestamp</th>
                  <th>Session ID</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.clicks.map((click, i) => (
                  <tr
                    key={click._id || i}
                    onMouseEnter={() => setHoveredPoint({ x: click.x, y: click.y, count: 1, elementTag: click.elementTag, elementText: click.elementText })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{
                      background: hoveredPoint && hoveredPoint.x === click.x && hoveredPoint.y === click.y
                        ? '#eff6ff'
                        : 'transparent'
                    }}
                  >
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ color: '#b45309', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {click.x} px
                    </td>
                    <td style={{ color: '#b45309', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {click.y} px
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--cf-blue)', fontWeight: 600 }}>
                        &lt;{click.elementTag || 'UNKNOWN'}&gt;
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {click.elementText || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(click.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {click.sessionId ? click.sessionId.substring(0, 14) + '...' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
