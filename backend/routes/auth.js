const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/login — Register or login a user
router.post('/login', async (req, res) => {
    try {
        const { name, phone, role } = req.body;

        if (!name || !phone || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists by phone
        let user = await User.findOne({ phone });

        if (user) {
            // Update name/role if user exists
            user.name = name;
            user.role = role;
            await user.save();
        } else {
            // Create new user
            user = await User.create({ name, phone, role });
        }

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id.toString(),
                name: user.name,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Auth Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
