const express = require('express');
const router = express.Router();
const Fish = require('../models/Fish');
const Auction = require('../models/Auction');

// GET /api/buyer/fish - all available fish
router.get('/fish', async (req, res) => {
    try {
        const fish = await Fish.find({ status: { $in: ['available', 'auctioning'] } })
            .populate('fishermanId', 'name phone')
            .sort({ createdAt: -1 });
        res.json({ fish });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/buyer/live-auctions - all active auctions
router.get('/live-auctions', async (req, res) => {
    try {
        const auctions = await Auction.find({ status: 'active' })
            .populate('fishId')
            .populate('fishermanId', 'name')
            .sort({ endTime: 1 });
        res.json({ auctions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/buyer/auction/:auctionId
router.get('/auction/:auctionId', async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.auctionId)
            .populate('fishId')
            .populate('fishermanId', 'name');
        if (!auction) return res.status(404).json({ message: 'Not found' });

        // Auto-end expired
        if (auction.status === 'active' && new Date() > auction.endTime) {
            auction.status = 'completed';
            await auction.save();
            if (auction.fishId) {
                await Fish.findByIdAndUpdate(auction.fishId._id, { status: 'sold' });
            }
        }
        res.json({ auction });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/buyer/place-bid
router.post('/place-bid', async (req, res) => {
    try {
        const { auctionId, bidderId, bidderName, amount } = req.body;
        const auction = await Auction.findById(auctionId);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });
        if (auction.status !== 'active') return res.status(400).json({ message: 'Auction is not active' });
        if (new Date() > auction.endTime) {
            auction.status = 'completed';
            await auction.save();
            return res.status(400).json({ message: 'Auction has ended' });
        }
        if (amount <= auction.highestBid) {
            return res.status(400).json({ message: `Bid must be higher than ₹${auction.highestBid}` });
        }
        auction.bids.push({ bidderId, bidderName, amount });
        auction.highestBid = amount;
        auction.highestBidder = { bidderId, bidderName };
        await auction.save();
        res.json({ message: 'Bid placed!', auction });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/buyer/my-bids/:buyerId
router.get('/my-bids/:buyerId', async (req, res) => {
    try {
        const { buyerId } = req.params;
        const auctions = await Auction.find({ 'bids.bidderId': buyerId })
            .populate('fishId', 'fishName quantityKg')
            .sort({ updatedAt: -1 });

        const myBids = auctions.map(a => {
            const myBidsInAuction = a.bids.filter(b => String(b.bidderId) === buyerId);
            const myHighestBid = Math.max(...myBidsInAuction.map(b => b.amount));
            const isWinner = String(a.highestBidder?.bidderId) === buyerId && a.status === 'completed';
            return {
                auctionId: a._id,
                fishName: a.fishId?.fishName,
                quantityKg: a.fishId?.quantityKg,
                myHighestBid,
                finalBid: a.highestBid,
                status: a.status,
                isWinner,
                endTime: a.endTime,
            };
        });

        res.json({ myBids });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/buyer/price-trends - completed auctions for market overview
router.get('/price-trends', async (req, res) => {
    try {
        const auctions = await Auction.find({ status: 'completed' })
            .populate('fishId', 'fishName quantityKg basePrice')
            .sort({ updatedAt: -1 })
            .limit(50);
        res.json({ auctions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
