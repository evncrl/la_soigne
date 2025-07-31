const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const reviewRoutes = require('./routes/review');
const authRoutes = require('./routes/auth'); // adjust path if needed


const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', authRoutes);


// ✅ Serve uploaded invoices & images
app.use('/invoices', express.static(path.join(__dirname, 'public/invoices')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API Routes
app.use('/api/v1', productRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1', userRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// ✅ Default Route (Shop Page)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shop.html'));
});

module.exports = app;
