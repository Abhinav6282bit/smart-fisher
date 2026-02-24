const mongoose = require('mongoose');

const fishSchema = new mongoose.Schema(
    {
        fishermanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fishName: {
            type: String,
            required: [true, 'Fish name is required'],
            trim: true,
        },
        quantityKg: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: 0.1,
        },
        basePrice: {
            type: Number,
            required: [true, 'Base price is required'],
            min: 0,
        },
        photoUrl: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['available', 'auctioning', 'sold'],
            default: 'available',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Fish', fishSchema);
