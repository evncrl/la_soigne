const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const cartRoutes = require('./routes/cart'); // ✅ ADD HERE

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded images publicly
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API Routes
app.use('/api/v1', productRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1/cart', cartRoutes); // ✅ CART

// ✅ Default Route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

module.exports = app;
