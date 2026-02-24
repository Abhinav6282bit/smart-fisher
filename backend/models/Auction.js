const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    bidderName: String,
    amount: Number,
    placedAt: { type: Date, default: Date.now },
});

const auctionSchema = new mongoose.Schema(
    {
        fishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Fish',
            required: true,
        },
        fishermanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        startingPrice: {
            type: Number,
            required: true,
        },
        highestBid: {
            type: Number,
            default: 0,
        },
        highestBidder: {
            bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            bidderName: String,
        },
        bids: [bidSchema],
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'cancelled'],
            default: 'active',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Auction', auctionSchema);
