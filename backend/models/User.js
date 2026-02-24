const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ['fisherman', 'buyer'],
            required: [true, 'Role is required'],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
