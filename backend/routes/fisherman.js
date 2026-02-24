const express = require('express');
const router = express.Router();
const Fish = require('../models/Fish');
const Auction = require('../models/Auction');

// POST /api/fisherman/add-fish
router.post('/add-fish', async (req, res) => {
    try {
        const { fishermanId, fishName, quantityKg, basePrice, photoUrl } = req.body;

        if (!fishermanId || !fishName || !quantityKg || !basePrice) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const fish = await Fish.create({
            fishermanId,
            fishName,
            quantityKg,
            basePrice,
            photoUrl: photoUrl || '',
        });

        res.status(201).json({ message: 'Fish added successfully', fish });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// POST /api/fisherman/start-auction
router.post('/start-auction', async (req, res) => {
    try {
        const { fishId, fishermanId, durationMinutes } = req.body;

        if (!fishId || !fishermanId) {
            return res.status(400).json({ message: 'fishId and fishermanId are required' });
        }

        const fish = await Fish.findById(fishId);
        if (!fish) return res.status(404).json({ message: 'Fish not found' });
        if (fish.status === 'auctioning') {
            return res.status(400).json({ message: 'Fish is already in an auction' });
        }

        const duration = durationMinutes || 5; // default 5 minutes
        const endTime = new Date(Date.now() + duration * 60 * 1000);

        const auction = await Auction.create({
            fishId,
            fishermanId,
            startingPrice: fish.basePrice,
            highestBid: fish.basePrice,
            endTime,
        });

        fish.status = 'auctioning';
        await fish.save();

        res.status(201).json({ message: 'Auction started', auction });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/fisherman/auctions/:fishermanId
router.get('/auctions/:fishermanId', async (req, res) => {
    try {
        const { fishermanId } = req.params;
        const auctions = await Auction.find({ fishermanId })
            .populate('fishId')
            .sort({ createdAt: -1 });
        res.json({ auctions });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/fisherman/auction/:auctionId
router.get('/auction/:auctionId', async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.auctionId).populate('fishId');
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Auto-complete if time expired
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

// POST /api/fisherman/place-bid
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

        res.json({ message: 'Bid placed successfully', auction });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET /api/fisherman/my-fish/:fishermanId
router.get('/my-fish/:fishermanId', async (req, res) => {
    try {
        const fish = await Fish.find({ fishermanId: req.params.fishermanId }).sort({ createdAt: -1 });
        res.json({ fish });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
