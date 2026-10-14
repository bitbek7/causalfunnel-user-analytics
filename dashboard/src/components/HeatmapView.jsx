import React, { useState, useEffect, useRef } from 'react';
import { fetchHeatmap, fetchTrackedPages } from '../services/api';

export default function HeatmapView() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visualMode, setVisualMode] = useState('density'); // 'density' or 'dots'
  const [showGrid, setShowGrid] = useState(true);
  const [dotRadius, setDotRadius] = useState(25);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const canvasRef = useRef(null);

  // Load available pages on mount
  useEffect(() => {
    async function loadPages() {
      try {
        const res = await fetchTrackedPages();
        if (res.success && res.data.length > 0) {
          setPages(res.data);
          // Default to the page with the most clicks
          const sorted = [...res.data].sort((a, b) => b.clicks - a.clicks);
          setSelectedPage(sorted[0].pageUrl);
        } else {
          // Fallback defaults
          const fallbackPages = [
            { pageUrl: '/demo/index.html', clicks: 0, totalEvents: 0 },
            { pageUrl: '/demo/product.html', clicks: 0, totalEvents: 0 }
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

  // Fetch heatmap data when selected page changes
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

  // Draw Heatmap onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Dark canvas background
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, width, height);

    // Optional Grid Overlay
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 50;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Axis labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '10px monospace';
      for (let x = 100; x < width; x += 100) {
        ctx.fillText(`${x}px`, x + 4, 14);
      }
      for (let y = 100; y < height; y += 100) {
        ctx.fillText(`${y}px`, 4, y - 4);
      }
    }

    if (!heatmapData || !heatmapData.clicks || heatmapData.clicks.length === 0) {
      // Empty watermark
      ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No click events recorded for this URL yet', width / 2, height / 2);
      return;
    }

    const clicks = heatmapData.clicks;

    // Render Mode 1: Smooth Density Radial Gradients
    if (visualMode === 'density') {
      clicks.forEach((c) => {
        // Normalize coordinates if necessary to fit within canvas bounds
        const x = Math.min(Math.max(c.x, 0), width);
        const y = Math.min(Math.max(c.y, 0), height);

        const radGrad = ctx.createRadialGradient(x, y, 0, x, y, dotRadius);
        radGrad.addColorStop(0, 'rgba(239, 68, 68, 0.85)');   // Hot red center
        radGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.6)'); // Amber halo
        radGrad.addColorStop(0.7, 'rgba(59, 130, 246, 0.2)'); // Cool blue outer
        radGrad.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Render Mode 2: Clean High-Precision Scatter Dots with Halos
    if (visualMode === 'dots') {
      clicks.forEach((c, i) => {
        const x = Math.min(Math.max(c.x, 0), width);
        const y = Math.min(Math.max(c.y, 0), height);

        // Outer glow
        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
        ctx.beginPath();
        ctx.arc(x, y, 14, 0, Math.PI * 2);
        ctx.fill();

        // Core marker
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();

        // White center point
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Highlight hovered point if active
    if (hoveredPoint) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hoveredPoint.x, hoveredPoint.y, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }, [heatmapData, visualMode, showGrid, dotRadius, hoveredPoint]);

  // Handle canvas mouse move for interactive inspection
  const handleCanvasMouseMove = (e) => {
    if (!heatmapData || !heatmapData.clicks || heatmapData.clicks.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find closest click point within 25px threshold
    let closest = null;
    let minDist = 30;

    heatmapData.clicks.forEach((pt) => {
      const dist = Math.hypot(pt.x - mouseX, pt.y - mouseY);
      if (dist < minDist) {
        minDist = dist;
        closest = pt;
      }
    });

    setHoveredPoint(closest);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="heatmap-layout">
      {/* Top Configuration & Control Bar */}
      <div className="glass-panel heatmap-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div>
            <label htmlFor="select-page-url" style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
              Select Page URL
            </label>
            <select
              id="select-page-url"
              className="page-select"
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

          <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
            <button
              id="btn-mode-density"
              className={`btn ${visualMode === 'density' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setVisualMode('density')}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              🔥 Density Map
            </button>
            <button
              id="btn-mode-dots"
              className={`btn ${visualMode === 'dots' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setVisualMode('dots')}
              style={{ fontSize: '12px', padding: '6px 14px' }}
            >
              🎯 Point Markers
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
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
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan)' }}>{dotRadius}px</span>
            </div>
          )}

          <div className="counter-badge" id="badge-total-page-clicks" style={{ fontSize: '12px', padding: '5px 12px' }}>
            {heatmapData ? `${heatmapData.totalClicks} clicks recorded` : 'Loading...'}
          </div>
        </div>
      </div>

      {/* Canvas Visualizer Card */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              Page Interaction Canvas: <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{selectedPage}</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Visualizing registered user click coordinates. Hover near any dot to inspect exact (x, y) coordinates.
            </p>
          </div>

          {hoveredPoint && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid var(--border-focus)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                color: '#fff',
                fontFamily: 'var(--font-mono)',
                display: 'flex',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
            >
              <span style={{ color: 'var(--amber)' }}>🎯 x: {hoveredPoint.x}, y: {hoveredPoint.y}</span>
              {hoveredPoint.elementTag && (
                <span style={{ color: 'var(--cyan)' }}>&lt;{hoveredPoint.elementTag}&gt;</span>
              )}
            </div>
          )}
        </div>

        <div className="heatmap-canvas-container">
          <div className="heatmap-canvas-box">
            <canvas
              id="heatmap-canvas"
              ref={canvasRef}
              width={1000}
              height={600}
              className="heatmap-canvas"
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            />
          </div>
        </div>
      </div>

      {/* Raw Coordinates Table (Shows complete data transparency) */}
      {heatmapData && heatmapData.clicks && heatmapData.clicks.length > 0 && (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <div className="panel-header">
            <div className="panel-title">
              <span>📊</span>
              <span>Click Coordinate Registry</span>
              <span className="counter-badge">{heatmapData.clicks.length} points</span>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '280px' }}>
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>X Coordinate</th>
                  <th>Y Coordinate</th>
                  <th>Element Tag</th>
                  <th>Element Text Preview</th>
                  <th>Timestamp</th>
                  <th>Session ID</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.clicks.map((click, i) => (
                  <tr
                    key={click._id || i}
                    onMouseEnter={() => setHoveredPoint(click)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{
                      background: hoveredPoint === click ? 'rgba(99, 102, 241, 0.2)' : 'transparent'
                    }}
                  >
                    <td>{i + 1}</td>
                    <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {click.x} px
                    </td>
                    <td style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {click.y} px
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--cyan)' }}>
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
