const express = require('express');
const router = express.Router();
const { createOrder} = require('../controllers/order');

// ✅ Checkout route (Customer)
router.post('/checkout', (req, res, next) => {
  console.log("📥 Checkout route hit");
  next();
}, createOrder);

// ✅ Fetch all orders (Admin)

// ✅ Update order status (Admin)

module.exports = router;
