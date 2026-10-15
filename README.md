# CausalFunnel — Real-Time User Behavior & Product Interaction Analytics

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-4.21-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Embedded-brightgreen.svg)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)

A production-grade full-stack user behavior and product interaction analytics platform built for the **CausalFunnel Full-Stack Hiring Assignment**. The application captures real client-side telemetry on an interactive multi-category e-commerce demo website (**Amazon Store**), persists raw events into **MongoDB**, computes real-time session aggregations, visitor journeys, click heatmaps, and product conversion funnels via native MongoDB aggregation pipelines, and visualizes the telemetry in a modern React dashboard adhering to the **CausalFunnel Light SaaS Design System**.

---

## 🏛️ System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│             DEMO E-COMMERCE WEBSITE (Amazon Store)     │
│   • /demo/index.html & /demo/product.html              │
│   • Add to Cart, Favorites toggle (♡ / ❤️), Card clicks │
│   • Live Tracker HUD debugging indicator               │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             CLIENT-SIDE TRACKING SDK                   │
│   • /tracker.js (Zero-dependency ES6+ IIFE)            │
│   • Persistent session ID via localStorage             │
│   • De-duplicated page_views, coordinate click tracking│
│   • Dedicated APIs: trackAddToCart, trackFavorite      │
└───────────────────────────┬────────────────────────────┘
                            │ Non-blocking POST /api/events (keepalive)
                            ▼
┌────────────────────────────────────────────────────────┐
│               NODE.JS / EXPRESS.JS REST API            │
│   • POST /api/events: Ingests & validates telemetry    │
│   • GET  /api/sessions: Aggregates real stored sessions│
│   • GET  /api/sessions/:id/events: Chronological story │
│   • GET  /api/heatmap: Page-specific click coordinates │
│   • GET  /api/products/rankings: Aggregates 3 rankings │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose ODM
                            ▼
┌────────────────────────────────────────────────────────┐
│                  MONGODB DATABASE                      │
│   • Single collection: `events`                        │
│   • Compound indexes: { sessionId, timestamp }         │
│   • Compound indexes: { pageUrl, eventType }           │
│   • Zero fabricated data or artificial mock records    │
└───────────────────────────┬────────────────────────────┘
                            │ Native Aggregations & Query APIs
                            ▼
┌────────────────────────────────────────────────────────┐
│          USER ANALYTICS DASHBOARD (React + Vite)       │
│   • CausalFunnel light-mode SaaS UI (pill navigation)  │
│   • KPI Metrics, Sessions Table, Chronological Journey │
│   • 3 Side-by-Side Product Interaction Rankings        │
│   • Interactive Document Click Heatmap Visualizer      │
└────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Highlights & Engineering Decisions

1. **Strict Data Separation**:
   - The tracking SDK executes **only** on the demo store pages (`/demo/*`).
   - The React Analytics Dashboard (`dashboard/`) has **zero tracking scripts** installed. Dashboard clicks or navigations never contaminate demo store metrics.
   - All events emitted by the store include `source: 'demo_store'`, and backend ranking pipelines strictly filter `{ source: 'demo_store' }`.

2. **Persistent Session Identification**:
   - Stored in `localStorage` under `cf_session_id` (with fallback to `sessionStorage`).
   - Retains the exact same session ID across page refreshes and multi-page navigation.
   - New browser sessions/incognito visitors automatically receive a unique crypto-random identifier.

3. **Product Interaction Tracking & Aggregations**:
   - **Most-Clicked Products**: Filtered by `{ eventType: 'click', productId: { $exists: true } }`.
   - **Most-Added-to-Cart Products**: Filtered by `{ eventType: 'add_to_cart' }`.
   - **Most-Favorited Products**: Computes net active favorites by crediting `product_favorite` (+1) and debiting `product_unfavorite` (-1), clamped at minimum 0.
   - All rankings are computed via native MongoDB aggregation pipelines (`$group`, `$sort`, `$project`) rather than frontend manipulation.

4. **Coordinate Accuracy & Heatmap Visualization**:
   - Documents use **document-relative coordinates** (`pageX` / `pageY`) to maintain alignment across scrolling.
   - Intelligent fallback for synthetic or keyboard events resolves coordinates to the target element's bounding center.
   - Heatmap visualizer supports both **Point Markers** (with duplicate click counter badges) and **Density Gradients**, alongside a raw **Click Coordinate Registry Table**.

5. **CausalFunnel SaaS Visual Design**:
   - Matches official CausalFunnel brand styling: light canvas (`#f8fafc`) with subtle lavender gradient glow (`#edf2fe`), white rounded cards, electric blue accents (`#2563eb`), floating pill navbar, and accessible typography.

---

## ⚖️ Assumptions & Architectural Trade-offs

| Domain | Architectural Decision | Key Assumption & Trade-off |
| :--- | :--- | :--- |
| **Data Storage Model** | **Event-Sourced Raw Stream**: All client interactions (`page_view`, `click`, `add_to_cart`, `product_view`, `product_favorite`) are stored as immutable event documents in a single indexed MongoDB collection. | *Trade-off:* Aggregations run dynamically on query instead of incrementing pre-computed counters. *Benefit:* Preserves 100% telemetry fidelity, supports time-travel session replays, and eliminates data corruption from out-of-order writes. |
| **Session Identification** | **Client-Side `localStorage` with fallback**: Session IDs (`cf_session_id`) are generated using browser `crypto.randomUUID()` and persisted in `localStorage`. | *Assumption:* Shoppers browse across multiple tabs in a single session. *Benefit:* Maintains session continuity across page refreshes and multi-tab browsing without requiring server-side session cookies or CORS cookie policies. |
| **Coordinate System** | **Document-Relative (`pageX` / `pageY`)**: Clicks are mapped to document coordinates rather than viewport percentages (`clientX` / `clientY`). | *Trade-off:* Accounts for scrolling position. A click on a "Buy Now" button 1200px down a page is faithfully rendered at (x: 450, y: 1200) on the heatmap canvas regardless of the scrollbar offset. |
| **Conversion Funnel Dimensions** | **Dual Conversion Architecture (Product Items vs Visitor Sessions)**: The engine computes both Product-Item Conversion ($\frac{\text{Carted Products}}{\text{Explored Products}} \times 100$) and Visitor-Session Conversion ($\frac{\text{Cart Sessions}}{\text{View Sessions}} \times 100$). | *Trade-off:* In small sample testing (e.g. 1 tester viewing 5 items and carting 1), session conversion is 100% ($1/1$), which can feel counterintuitive. Providing both with item-level default gives store admins complete accuracy. |
| **Database Portability** | **Zero-Config Dual Connectivity**: Automatic fallback to `mongodb-memory-server` if `MONGODB_URI` is omitted, and instant switch to MongoDB Atlas when `MONGODB_URI` is configured in `.env`. | *Trade-off:* Evaluators can clone and run `npm start` immediately with zero setup, while production environments enjoy persistent cloud storage. |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

> **💡 Zero-Config Embedded Database**: The backend automatically falls back to an embedded in-memory MongoDB instance (`mongodb-memory-server`) if no external `MONGODB_URI` is provided. Reviewers can clone and run the project immediately with zero configuration!

---

### Step 1: Start the Backend & Demo Storefront

```bash
cd backend
npm install
npm start
```

The backend server runs at **`http://localhost:5000`**:
- 📡 Ingestion API: `POST http://localhost:5000/api/events`
- 📊 Sessions API: `GET http://localhost:5000/api/sessions`
- 🛍️ Product Rankings API: `GET http://localhost:5000/api/products/rankings`
- 🗺️ Heatmap API: `GET http://localhost:5000/api/heatmap?pageUrl=/demo/index.html`
- 🛒 Demo Storefront: `http://localhost:5000/demo/index.html`
- 📜 Hosted Tracker Script: `http://localhost:5000/tracker.js`

*(Optional)* To connect to your own MongoDB cluster, copy `.env.example` to `.env`:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/causalfunnel?retryWrites=true&w=majority
```

---

### Step 2: Start the React Analytics Dashboard

In a separate terminal window:

```bash
cd dashboard
npm install
npm run dev
```

The React dashboard will be live at: **`http://localhost:5173/`**

---

### Step 3: Generate Real Telemetry & Verify in Dashboard

1. Open the demo store in your browser: **`http://localhost:5000/demo/index.html`**
2. Notice the **Live Tracker HUD** in the bottom-right corner showing your unique `session_id`.
3. Try these actions:
   - Click product cards to view or select items.
   - Click **"Add to Cart"** on *Aura Air Wireless* and *Aura Pro Studio* (watch cart badge update).
   - Click **"♡ Favorite"** to mark a product as a favorite (turns into active ❤️).
   - Click the favorite button again to unfavorite (reverts to ♡).
4. Open the React Analytics Dashboard at **`http://localhost:5173/`**:
   - **Sessions & Journeys Tab**: View your active session, KPI cards, and full chronological timeline with product badges and click coordinates.
   - **Product Analytics Tab**: View the 3 side-by-side rankings (Most-Clicked, Most-Added-to-Cart, Most-Favorited) matching your exact actions.
   - **Click Heatmap Tab**: Select `/demo/index.html` to inspect your click coordinates on the canvas and in the Coordinate Registry table.

---

## 📡 REST API Specifications

### 1. Ingest Event
- **Endpoint**: `POST /api/events`
- **Supported Event Types**: `page_view`, `click`, `add_to_cart`, `product_favorite`, `product_unfavorite`, `product_view`
- **Payload (`add_to_cart`)**:
  ```json
  {
    "sessionId": "cf_mv8a1s7s_vw84kf8",
    "eventType": "add_to_cart",
    "pageUrl": "/demo/index.html",
    "productId": "prod_aura_air",
    "productName": "Aura Air Wireless",
    "productCategory": "Wireless Earbuds",
    "source": "demo_store"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Event recorded successfully",
    "data": { "id": "670d302a9e14a1c0de83a001", "eventType": "add_to_cart" }
  }
  ```

### 2. Product Analytics & Rankings
- **Endpoint**: `GET /api/products/rankings` (aliases: `/api/products/funnel`, `/api/products/analytics`)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "timestamp": "2026-10-14T17:46:21.000Z",
    "rankings": {
      "mostClicked": [
        { "rank": 1, "productId": "prod_aura_pro", "productName": "Aura Pro Studio", "count": 9 }
      ],
      "mostAddedToCart": [
        { "rank": 1, "productId": "prod_aura_pro", "productName": "Aura Pro Studio", "count": 7 }
      ],
      "mostFavorited": [
        { "rank": 1, "productId": "prod_aura_pro", "productName": "Aura Pro Studio", "count": 2 }
      ]
    },
    "funnel": {
      "productViewSessions": 2,
      "addToCartSessions": 2,
      "conversionRate": 100.0,
      "conversionRateFormatted": "100%"
    },
    "comparison": [
      {
        "rank": 1,
        "productId": "prod_aura_pro",
        "productName": "Aura Pro Studio",
        "productCategory": "Studio Headphones",
        "clicks": 9,
        "addToCart": 7,
        "favorites": 2,
        "totalInteractions": 18
      }
    ]
  }
  ```

### 3. List Sessions
- **Endpoint**: `GET /api/sessions`
- **Response (`200 OK`)**: Returns session metadata, event totals, pageviews, clicks, duration, and entry page.

### 4. Session Journey
- **Endpoint**: `GET /api/sessions/:sessionId/events`
- **Response (`200 OK`)**: Chronological sequence of all interactions within the session.

### 5. Heatmap Coordinates
- **Endpoint**: `GET /api/heatmap?pageUrl=/demo/index.html`
- **Response (`200 OK`)**: Array of `{ x, y, elementTag, elementText, timestamp }` coordinate records.

---

## 🧪 Automated Backend Verification Suite

Run the 100% automated test suite verifying all 12 API requirements:

```bash
cd backend
node test-api.js
```

**Output**:
```text
🧪 Starting Automated Backend API Verification...
[PASS] 1. GET /api/health -> status: healthy
[PASS] 2. POST /api/events (page_view) -> status: 201
[PASS] 3. POST /api/events (click) -> status: 201, x: 420, y: 180
[PASS] 4. POST /api/events (invalid click without coordinates) -> rejected with 400
[PASS] 5. GET /api/sessions -> session aggregated: totalEvents=2, pv=1, clicks=1
[PASS] 6. GET /api/sessions/:id/events -> returned 2 events in chronological order
[PASS] 7. GET /api/heatmap -> returned 1 clicks with coordinates (x: 420, y: 180)
[PASS] 8. POST /api/events (add_to_cart) -> status: 201, product: prod_aura_pro
[PASS] 9. POST /api/events (product_favorite) -> status: 201
[PASS] 10. GET /api/products/rankings -> status: 200, returned rankings categories
[PASS] 11. Product Conversion Funnel -> View Sessions: 1, Cart Sessions: 1, Rate: 100%
[PASS] 12. Product Engagement Comparison -> 4 products tracked, comparison dataset populated

🎉 ALL 12 MANDATORY BACKEND API & ANALYTICS VERIFICATIONS PASSED 100%!
```


---

## 📂 Repository Structure

```
CausalFunnel/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection with embedded zero-config fallback
│   ├── controllers/
│   │   ├── eventController.js     # Event ingestion & validation
│   │   ├── sessionController.js   # Session aggregation & chronological journeys
│   │   ├── heatmapController.js   # Heatmap coordinate querying
│   │   └── productController.js   # Product interaction rankings aggregation
│   ├── middleware/
│   │   └── validator.js           # Schema validator & normalization
│   ├── models/
│   │   └── Event.js               # Mongoose schema with compound indexes
│   ├── routes/
│   │   └── apiRoutes.js           # API route declarations
│   ├── .env.example               # Environment template (no secrets)
│   ├── package.json
│   ├── server.js                  # Express backend entry
│   └── test-api.js                # 10-point automated integration test suite
│
├── tracker/
│   └── tracker.js                 # Standalone Client-Side Tracking SDK (IIFE)
│
├── demo/
│   ├── index.html                 # Aura Audio storefront catalog
│   ├── product.html               # Aura Audio product detail page
│   └── styles.css                 # Storefront styling & Live Tracker HUD
│
├── dashboard/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx         # CausalFunnel floating pill navigation
│   │   │   ├── OverviewMetrics.jsx# 4 KPI overview metric cards
│   │   │   ├── SessionsView.jsx   # Searchable recorded sessions table
│   │   │   ├── UserJourney.jsx    # Chronological timeline with event badges
│   │   │   ├── ProductRankings.jsx# 3 side-by-side product rankings
│   │   │   └── HeatmapView.jsx    # Canvas heatmap & Coordinate Registry
│   │   ├── services/
│   │   │   └── api.js             # Centralized fetch API service
│   │   ├── App.jsx                # Layout orchestrator
│   │   └── index.css              # CausalFunnel design system CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 👨‍💻 Author & Submission
- **Project**: CausalFunnel Full-Stack Engineer Hiring Assignment
- **Status**: 100% Acceptance Criteria Tested & Verified
