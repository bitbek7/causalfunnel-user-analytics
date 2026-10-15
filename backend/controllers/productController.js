const Event = require('../models/Event');

/**
 * Product catalog metadata to ensure stable names and categories
 */
const CATALOG_INFO = {
  'prod_echo_dot': { productName: 'Echo Dot Smart Speaker', productCategory: 'Smart Home' },
  'prod_ring_doorbell': { productName: 'Ring Video Doorbell', productCategory: 'Smart Home' },
  'prod_fire_tv_stick': { productName: 'Fire TV Stick 4K Max', productCategory: 'Smart Home' },
  'prod_kindle_paperwhite': { productName: 'Kindle Paperwhite (16 GB)', productCategory: 'E-Readers & Books' },
  'prod_instant_pot': { productName: 'Instant Pot Pro 10-in-1', productCategory: 'Home & Kitchen' },
  'prod_ninja_airfryer': { productName: 'Ninja DualZone Air Fryer', productCategory: 'Home & Kitchen' },
  'prod_fitbit_charge': { productName: 'Fitbit Charge 6 Tracker', productCategory: 'Sports & Wearables' },
  'prod_yeti_tumbler': { productName: 'YETI Rambler 30 oz Tumbler', productCategory: 'Sports & Wearables' },
  // Backward compatibility:
  'prod_aura_pro': { productName: 'Aura Pro Studio', productCategory: 'Studio Headphones' },
  'prod_aura_air': { productName: 'Aura Air Wireless', productCategory: 'Wireless Earbuds' },
  'prod_aura_stage': { productName: 'Aura Stage Monitors', productCategory: 'Stage Audio' },
  'prod_aura_bass': { productName: 'Aura Bass Subwoofer', productCategory: 'Bass & Subwoofers' }
};

/**
 * Product Interaction Analytics Controller
 * Computes real-time analytics directly from stored MongoDB events:
 * 1. Rankings (Most-clicked, Most-added-to-cart, Most-favorited)
 * 2. Conversion Funnel (Product View Sessions -> Add to Cart Sessions -> Conversion Rate)
 * 3. Product Engagement Comparison (Clicks vs Cart vs Net Favorites per product)
 *
 * GET /api/products/rankings
 */
async function getProductRankings(req, res) {
  try {
    const sourceFilter = { source: 'demo_store' };

    // 1. Most-Clicked Products Pipeline
    const mostClicked = await Event.aggregate([
      {
        $match: {
          ...sourceFilter,
          eventType: 'click',
          productId: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          productCategory: { $first: '$productCategory' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1, productName: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: { $ifNull: ['$productName', '$_id'] },
          productCategory: 1,
          count: 1
        }
      }
    ]);

    // 2. Most-Added-to-Cart Products Pipeline
    const mostAddedToCart = await Event.aggregate([
      {
        $match: {
          ...sourceFilter,
          eventType: 'add_to_cart',
          productId: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          productCategory: { $first: '$productCategory' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1, productName: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: { $ifNull: ['$productName', '$_id'] },
          productCategory: 1,
          count: 1
        }
      }
    ]);

    // 3. Most-Favorited Products Pipeline (Accounts for favorite and unfavorite events)
    const mostFavorited = await Event.aggregate([
      {
        $match: {
          ...sourceFilter,
          eventType: { $in: ['product_favorite', 'product_unfavorite'] },
          productId: { $exists: true, $ne: null, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          productCategory: { $first: '$productCategory' },
          netFavorites: {
            $sum: {
              $cond: [{ $eq: ['$eventType', 'product_favorite'] }, 1, -1]
            }
          },
          totalAdded: {
            $sum: {
              $cond: [{ $eq: ['$eventType', 'product_favorite'] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          productId: '$_id',
          productName: { $ifNull: ['$productName', '$_id'] },
          productCategory: 1,
          count: { $max: ['$netFavorites', 0] },
          totalAdded: 1
        }
      },
      { $sort: { count: -1, productName: 1 } },
      { $limit: 10 }
    ]);

    // 4. Product Conversion Funnel Calculations
    // A. Session-Based Conversion (Visitor Level)
    const productViewSessions = await Event.distinct('sessionId', {
      ...sourceFilter
    });
    const addToCartSessions = await Event.distinct('sessionId', {
      ...sourceFilter,
      eventType: 'add_to_cart'
    });
    const totalAddToCartEvents = await Event.countDocuments({
      ...sourceFilter,
      eventType: 'add_to_cart'
    });

    const sessionViewCount = productViewSessions.length;
    const sessionCartCount = addToCartSessions.length;
    let sessionConversionRate = null;
    let sessionConversionRateFormatted = 'N/A';
    if (sessionViewCount > 0) {
      const rawRate = Math.min((sessionCartCount / sessionViewCount) * 100, 100);
      sessionConversionRate = Math.round(rawRate * 10) / 10;
      sessionConversionRateFormatted = `${sessionConversionRate}%`;
    }

    // B. Product Item-Based Conversion (Products Explored vs Products Added to Cart)
    const distinctProductsViewed = await Event.distinct('productId', {
      ...sourceFilter,
      productId: { $exists: true, $ne: null, $ne: '' }
    });
    const distinctProductsCarted = await Event.distinct('productId', {
      ...sourceFilter,
      eventType: 'add_to_cart',
      productId: { $exists: true, $ne: null, $ne: '' }
    });
    const totalProductViews = await Event.countDocuments({
      ...sourceFilter,
      $or: [
        { eventType: 'product_view' },
        { productId: { $exists: true, $ne: null, $ne: '' } }
      ]
    });

    const productViewCount = distinctProductsViewed.length;
    const productCartCount = distinctProductsCarted.length;
    let productConversionRate = null;
    let productConversionRateFormatted = 'N/A';
    if (productViewCount > 0) {
      const rawRate = Math.min((productCartCount / productViewCount) * 100, 100);
      productConversionRate = Math.round(rawRate * 10) / 10;
      productConversionRateFormatted = `${productConversionRate}%`;
    }

    // 5. Product Engagement Comparison (Clicks vs Cart vs Favorites for Chart & CSV)
    const allProductIds = new Set([
      ...Object.keys(CATALOG_INFO),
      ...mostClicked.map(p => p.productId),
      ...mostAddedToCart.map(p => p.productId),
      ...mostFavorited.map(p => p.productId)
    ]);

    const clickMap = new Map(mostClicked.map(p => [p.productId, p]));
    const cartMap = new Map(mostAddedToCart.map(p => [p.productId, p]));
    const favMap = new Map(mostFavorited.map(p => [p.productId, p]));

    const comparison = Array.from(allProductIds).map(id => {
      const clickItem = clickMap.get(id);
      const cartItem = cartMap.get(id);
      const favItem = favMap.get(id);
      const catalogItem = CATALOG_INFO[id] || {};

      const productName = clickItem?.productName || cartItem?.productName || favItem?.productName || catalogItem.productName || id;
      const productCategory = clickItem?.productCategory || cartItem?.productCategory || favItem?.productCategory || catalogItem.productCategory || 'Audio';
      const clicks = clickItem ? clickItem.count : 0;
      const addToCart = cartItem ? cartItem.count : 0;
      const favorites = favItem ? favItem.count : 0;
      const totalInteractions = clicks + addToCart + favorites;

      return {
        productId: id,
        productName,
        productCategory,
        clicks,
        addToCart,
        favorites,
        totalInteractions
      };
    });

    // Sort comparison by total interactions descending, then by name
    comparison.sort((a, b) => b.totalInteractions - a.totalInteractions || a.productName.localeCompare(b.productName));
    const comparisonWithRanks = comparison.map((item, idx) => ({ rank: idx + 1, ...item }));
    const totalProductInteractions = comparison.reduce((sum, item) => sum + (item.totalInteractions || 0), 0);

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      rankings: {
        mostClicked: mostClicked.map((item, idx) => ({ rank: idx + 1, ...item })),
        mostAddedToCart: mostAddedToCart.map((item, idx) => ({ rank: idx + 1, ...item })),
        mostFavorited: mostFavorited.map((item, idx) => ({ rank: idx + 1, ...item }))
      },
      funnel: {
        // Session-based conversion (visitor level)
        productViewSessions: sessionViewCount,
        addToCartSessions: sessionCartCount,
        sessionConversionRate,
        sessionConversionRateFormatted,
        // Product item-based conversion (items viewed vs items carted - addresses user testing accuracy)
        distinctProductsViewed: productViewCount,
        distinctProductsCarted: productCartCount,
        totalProductViews,
        totalAddToCartEvents,
        productConversionRate,
        productConversionRateFormatted,
        // Default conversion rate: product-level if available, falling back to session-level
        conversionRate: productConversionRate !== null ? productConversionRate : sessionConversionRate,
        conversionRateFormatted: productConversionRateFormatted !== 'N/A' ? productConversionRateFormatted : sessionConversionRateFormatted,
        totalInteractions: totalProductInteractions
      },
      comparison: comparisonWithRanks
    });
  } catch (err) {
    console.error('[Product Rankings Error]', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to compute product rankings',
      details: err.message
    });
  }
}

module.exports = { getProductRankings };
