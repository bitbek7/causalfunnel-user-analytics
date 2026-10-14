const Event = require('../models/Event');

/**
 * Product catalog metadata to ensure stable names and categories
 */
const CATALOG_INFO = {
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

    // 4. Product Conversion Funnel (Distinct Sessions)
    // Stage 1: Sessions with at least one product view (product_view event, product detail page, or product card interaction)
    const productViewFilter = {
      ...sourceFilter,
      $or: [
        { eventType: 'product_view' },
        { pageUrl: { $regex: /product/i } },
        { productId: { $exists: true, $ne: null, $ne: '' } }
      ]
    };

    // Stage 2: Sessions with at least one add_to_cart event
    const addToCartFilter = {
      ...sourceFilter,
      eventType: 'add_to_cart'
    };

    const productViewSessions = await Event.distinct('sessionId', productViewFilter);
    const addToCartSessions = await Event.distinct('sessionId', addToCartFilter);

    const productViewCount = productViewSessions.length;
    const addToCartCount = addToCartSessions.length;

    let conversionRate = null;
    let conversionRateFormatted = 'N/A';
    if (productViewCount > 0) {
      const rawRate = (addToCartCount / productViewCount) * 100;
      conversionRate = Math.round(rawRate * 10) / 10;
      conversionRateFormatted = `${conversionRate}%`;
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

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      rankings: {
        mostClicked: mostClicked.map((item, idx) => ({ rank: idx + 1, ...item })),
        mostAddedToCart: mostAddedToCart.map((item, idx) => ({ rank: idx + 1, ...item })),
        mostFavorited: mostFavorited.map((item, idx) => ({ rank: idx + 1, ...item }))
      },
      funnel: {
        productViewSessions: productViewCount,
        addToCartSessions: addToCartCount,
        conversionRate,
        conversionRateFormatted
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
