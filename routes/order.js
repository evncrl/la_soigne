const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/order');

// ✅ Customer Checkout
router.post('/checkout', createOrder);

// ✅ Admin: Get All Orders
router.get('/', getAllOrders);

// ✅ Admin: Update Order Status
router.put('/:id/status', updateOrderStatus);

module.exports = router;
