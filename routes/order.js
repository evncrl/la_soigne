const express = require('express');
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getCustomerOrders,
  getOrderItems //  NEW
} = require('../controllers/order');

//  Customer Checkout
router.post('/checkout', createOrder);

//  Admin: Get All Orders
router.get('/', getAllOrders);

//  Admin: Update Order Status
router.put('/:id/status', updateOrderStatus);

//  Customer: Get Their Orders ("My Orders")
router.get('/customer/:customer_id', getCustomerOrders);

//  Get Items of a Specific Order
router.get('/:orderId/items', getOrderItems);

module.exports = router;
