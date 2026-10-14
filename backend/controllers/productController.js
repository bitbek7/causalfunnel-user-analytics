const Event = require('../models/Event');

/**
 * Product Interaction Analytics Controller
 * Calculates rankings directly from stored MongoDB events:
 * 1. Most-clicked products
 * 2. Most-added-to-cart products
 * 3. Most-favorited products (accounting for favorite and unfavorite events)
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

    // 3. Most-Favorited Products Pipeline (Accounts for favorite and unfavorite)
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

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      rankings: {
        mostClicked: mostClicked.map((item, idx) => ({ rank: idx + 1, ...item })),
        mostAddedToCart: mostAddedToCart.map((item, idx) => ({ rank: idx + 1, ...item })),
        mostFavorited: mostFavorited.map((item, idx) => ({ rank: idx + 1, ...item }))
      }
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
