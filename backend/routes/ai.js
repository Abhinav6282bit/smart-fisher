const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const Fish = require('../models/Fish');

// GET /api/ai/price-suggest?fishName=Rohu
router.get('/price-suggest', async (req, res) => {
    try {
        const { fishName } = req.query;
        if (!fishName || fishName.trim().length < 2) {
            return res.status(400).json({ message: 'Please provide a fish name' });
        }

        const name = fishName.trim().toLowerCase();

        // Find completed auctions for this fish type (case-insensitive)
        const auctions = await Auction.find({ status: 'completed' })
            .populate({ path: 'fishId', match: { fishName: { $regex: name, $options: 'i' } } })
            .sort({ updatedAt: -1 })
            .limit(30);

        const matchedAuctions = auctions.filter(a => a.fishId !== null);

        // Also look at base prices of all fish of this type
        const fishListings = await Fish.find({ fishName: { $regex: name, $options: 'i' } });
        const basePrices = fishListings.map(f => f.basePrice);

        if (matchedAuctions.length === 0 && fishListings.length === 0) {
            // No history — use government-typical ranges as fallback
            const fallback = getFallbackPrice(name);
            return res.json({
                hasHistory: false,
                fishName: fishName.trim(),
                suggestion: fallback.suggested,
                confidence: 'low',
                reason: fallback.reason,
                stats: null,
            });
        }

        const finalBids = matchedAuctions.map(a => a.highestBid).filter(Boolean);
        const allPrices = [...finalBids, ...basePrices];

        const avg = Math.round(allPrices.reduce((s, p) => s + p, 0) / allPrices.length);
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);

        // AI suggestion: weighted average favoring recent auctions (final bid) over base prices
        const finalBidWeight = 0.7;
        const basePriceWeight = 0.3;

        let suggested = avg;
        if (finalBids.length > 0 && basePrices.length > 0) {
            const avgFinal = Math.round(finalBids.reduce((s, p) => s + p, 0) / finalBids.length);
            const avgBase = Math.round(basePrices.reduce((s, p) => s + p, 0) / basePrices.length);
            suggested = Math.round(avgFinal * finalBidWeight + avgBase * basePriceWeight);
        }

        // Confidence based on data volume
        let confidence = 'low';
        if (matchedAuctions.length >= 5) confidence = 'high';
        else if (matchedAuctions.length >= 2) confidence = 'medium';

        const trend = finalBids.length >= 2
            ? finalBids[0] > finalBids[finalBids.length - 1] ? 'rising' : 'falling'
            : 'stable';

        res.json({
            hasHistory: true,
            fishName: fishName.trim(),
            suggestion: suggested,
            confidence,
            trend,
            stats: {
                avgPrice: avg,
                minPrice: min,
                maxPrice: max,
                auctionCount: matchedAuctions.length,
                listingCount: fishListings.length,
                recentSales: finalBids.slice(0, 5),
            },
            reason: `Based on ${matchedAuctions.length} auction${matchedAuctions.length !== 1 ? 's' : ''} and ${fishListings.length} listing${fishListings.length !== 1 ? 's' : ''}`,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/ai/market-summary - overall market health
router.get('/market-summary', async (req, res) => {
    try {
        const [totalFish, totalAuctions, activeAuctions, completedAuctions] = await Promise.all([
            Fish.countDocuments(),
            Auction.countDocuments(),
            Auction.countDocuments({ status: 'active' }),
            Auction.countDocuments({ status: 'completed' }),
        ]);

        const recentAuctions = await Auction.find({ status: 'completed' })
            .populate('fishId', 'fishName')
            .sort({ updatedAt: -1 })
            .limit(5);

        const totalRevenue = recentAuctions.reduce((s, a) => s + (a.highestBid || 0), 0);

        res.json({
            totalFish,
            totalAuctions,
            activeAuctions,
            completedAuctions,
            totalRevenue,
            recentActivity: recentAuctions.map(a => ({
                fishName: a.fishId?.fishName,
                finalPrice: a.highestBid,
                winner: a.highestBidder?.bidderName,
            })),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

function getFallbackPrice(fishName) {
    // Common Indian fish approximate market prices (₹/kg)
    const priceMap = {
        rohu: { min: 120, max: 220, suggested: 160 },
        catla: { min: 130, max: 250, suggested: 180 },
        pomfret: { min: 300, max: 800, suggested: 500 },
        hilsa: { min: 400, max: 1200, suggested: 700 },
        surmai: { min: 350, max: 700, suggested: 500 },
        rawas: { min: 300, max: 600, suggested: 400 },
        bangda: { min: 100, max: 250, suggested: 160 },
        prawns: { min: 300, max: 800, suggested: 500 },
        shrimp: { min: 250, max: 700, suggested: 400 },
        crab: { min: 400, max: 900, suggested: 600 },
        tuna: { min: 200, max: 600, suggested: 350 },
        salmon: { min: 600, max: 1500, suggested: 900 },
        tilapia: { min: 80, max: 180, suggested: 120 },
        mackerel: { min: 100, max: 300, suggested: 180 },
        sardine: { min: 60, max: 150, suggested: 100 },
    };

    for (const [key, val] of Object.entries(priceMap)) {
        if (fishName.includes(key) || key.includes(fishName)) {
            return { suggested: val.suggested, reason: `Estimated from typical market rates for ${key}` };
        }
    }

    return { suggested: 200, reason: 'No historical data. Using general market estimate.' };
}

module.exports = router;
