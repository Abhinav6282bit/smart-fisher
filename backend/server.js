// Fix: Force IPv4-first DNS resolution — resolves querySrv ECONNREFUSED on Windows with Node.js 18+
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection with retry
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4, // Force IPv4
    });
    console.log('✅ MongoDB Connected Successfully!');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};
connectDB();

// Routes
const authRoutes = require('./routes/auth');
const fishermanRoutes = require('./routes/fisherman');
const buyerRoutes = require('./routes/buyer');
const aiRoutes = require('./routes/ai');
app.use('/api/auth', authRoutes);
app.use('/api/fisherman', fishermanRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    db: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
});
