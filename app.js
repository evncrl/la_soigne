const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const productRoutes = require('./routes/product');
const userRoutes = require('./routes/user'); // ✅ Added

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded images publicly
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// ✅ Serve static HTML/CSS/JS files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API Routes
app.use('/api/v1', productRoutes);
app.use('/api/v1', userRoutes); // ✅ Added

// ✅ Default Route (Optional)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

module.exports = app;
